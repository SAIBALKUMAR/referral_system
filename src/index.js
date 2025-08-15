class ReferralGraph {
    constructor() {
        this.adjacencyList = {}; // To store users and their referrals
        this.reachCache = {}; // To cache the full downstream reach of each user
        this.referrerCapacity = {}; // To track the number of successful referrals made by each referrer
        this.maxReferrerCapacity = 10; // Each referrer can make up to 10 successful referrals
    }

    // Method to add a new user
    addUser(user) {
        if (!this.adjacencyList[user]) {
            this.adjacencyList[user] = {
                referrals: [],
                referrer: null, // To keep track of the user's referrer
            };
        }
    }

    // Method to validate a referral
    validateReferral(referrer, candidate) {
        if (!referrer || !candidate) {
            return "Invalid referrer or candidate!";
        }
        if (referrer === candidate) {
            return "Self-referral is not allowed!";
        }
        if (!this.adjacencyList[candidate]) {
            this.addUser(candidate);
        }
        if (this.adjacencyList[candidate].referrer) {
            return "Candidate can only be referred by one user!";
        }
        if (this.hasCycle(candidate, referrer, new Set())) {
            return "Cycle detected! Referral cannot be added.";
        }
        return null; // No validation errors
    }

    // Method to add a referral link from referrer to candidate
    addReferral(referrer, candidate) {
        this.addUser(referrer);
        this.addUser(candidate);

        const validationError = this.validateReferral(referrer, candidate);
        if (validationError) {
            return validationError;
        }

        // Clear reach cache as the graph structure has changed
        this.reachCache = {};

        // If all checks pass, add the referral
        this.adjacencyList[referrer].referrals.push(candidate);
        this.adjacencyList[candidate].referrer = referrer;
        return `${candidate} referred by ${referrer}`;
    }

    // Method to get a user's direct referrals
    getReferrals(user) {
        if (!this.adjacencyList[user]) {
            return [];
        }
        return this.adjacencyList[user].referrals;
    }

    // Helper method to check for cycles
    hasCycle(candidate, referrer, visited) {
        if (visited.has(referrer)) {
            return true;
        }

        visited.add(referrer);

        for (let referral of this.adjacencyList[referrer].referrals) {
            if (referral !== candidate) {
                if (this.hasCycle(candidate, referral, visited)) {
                    return true; // Cycle detected
                }
            }
        }

        visited.delete(referrer);
        return false; // No cycle detected
    }

    // Method to calculate direct and indirect referral counts
    totalReferralCount(user) {
        if (!this.adjacencyList[user]) {
            return { direct: 0, indirect: 0, total: 0 };
        }

        const direct = this.adjacencyList[user].referrals.length;
        const visited = new Set([user]);
        let indirect = 0;

        // BFS to count indirect referrals
        const queue = [...this.adjacencyList[user].referrals];
        for (const referral of queue) visited.add(referral);

        while (queue.length > 0) {
            const current = queue.shift();
            for (const referral of this.adjacencyList[current]?.referrals || []) {
                if (!visited.has(referral)) {
                    visited.add(referral);
                    queue.push(referral);
                    indirect++;
                }
            }
        }

        return { direct, indirect, total: direct + indirect };
    }

    // Method to compute full downstream reach set for a user
    computeFullReach(user) {
        if (this.reachCache[user]) {
            return this.reachCache[user];
        }
        const visited = new Set();
        const reachSet = new Set();
        
        const bfs = (startUser) => {
            const queue = [startUser];
            visited.add(startUser);

            while (queue.length > 0) {
                const current = queue.shift();
                for (const referral of this.adjacencyList[current].referrals) {
                    if (!visited.has(referral)) {
                        visited.add(referral);
                        reachSet.add(referral);
                        queue.push(referral);
                    }
                }
            }
        };

        if (this.adjacencyList[user]) {
            bfs(user);
        }

        this.reachCache[user] = Array.from(reachSet); // Cache reach set
        return this.reachCache[user];
    }

    // Metric 1: Unique Reach Expansion
    uniqueReachExpansion(k) {
        const selectedUsers = [];
        const coveredCandidates = new Set();

        const users = Object.keys(this.adjacencyList);
        while (selectedUsers.length < k) {
            let bestUser = null;
            let bestNewCandidates = 0;

            for (const user of users) {
                const fullReach = new Set(this.computeFullReach(user));
                // Count candidates newly covered
                const newCandidates = [...fullReach].filter(candidate => !coveredCandidates.has(candidate)).length;

                // Check for the best user
                if (newCandidates > bestNewCandidates) {
                    bestNewCandidates = newCandidates;
                    bestUser = user;
                }
            }

            if (bestUser) {
                selectedUsers.push(bestUser);
                const newReach = this.computeFullReach(bestUser);
                newReach.forEach(candidate => coveredCandidates.add(candidate));
            }
        }

        return selectedUsers;
    }

    // Method to calculate total reach score for a user (direct + indirect weighted)
    calculateReachScore(user) {
        if (!this.adjacencyList[user]) {
            return 0;
        }

        const { direct, indirect } = this.totalReferralCount(user);
        // Weight direct referrals more heavily than indirect ones
        return direct * 2 + indirect; // Direct referrals count double
    }

    // Method to get top referrers by their reach score
    topReferrersByReach(k) {
        const users = Object.keys(this.adjacencyList);
        const reachScores = users.map(user => ({
            user,
            score: this.calculateReachScore(user)
        }));

        // Sort by score in descending order
        reachScores.sort((a, b) => b.score - a.score);

        // Return top k referrers
        return reachScores.slice(0, k).map(item => ({
            user: item.user,
            score: item.score,
            details: this.totalReferralCount(item.user)
        }));
    }

    // Metric 2: Flow Centrality
    flowCentrality() {
        const centralityScores = {};
        const users = Object.keys(this.adjacencyList);

        // Pre-compute shortest paths between all pairs of users via BFS
        const allShortestPaths = {};
        users.forEach(user => {
            allShortestPaths[user] = this.shortestPathBFS(user);
        });

        users.forEach(v => {
            centralityScores[v] = 0;

            for (let s of users) {
                for (let t of users) {
                    if (s !== t && s !== v && t !== v) {
                        const distST = allShortestPaths[s][t];
                        const distSV = allShortestPaths[s][v];
                        const distVT = allShortestPaths[v][t];

                        if (distST === distSV + distVT) {
                            // If v is on the shortest path from s to t
                            centralityScores[v]++;
                        }
                    }
                }
            }
        });

        // Sort users based on their centrality scores
        return Object.entries(centralityScores).sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
    }

    // Helper method for calculating shortest paths via BFS
    shortestPathBFS(startUser) {
        const distances = {};
        const queue = [startUser];
        distances[startUser] = 0;

        while (queue.length > 0) {
            const current = queue.shift();
            const steps = distances[current];

            for (const neighbor of this.adjacencyList[current].referrals) {
                if (!(neighbor in distances)) {
                    distances[neighbor] = steps + 1;
                    queue.push(neighbor);
                }
            }
        }

        return distances;
    }

    // Method to simulate network growth
    simulate(p, days) {
        // Reset the referrer capacity
        this.referrerCapacity = {};
        
        // Initialize the number of active referrers and total referrals
        let activeReferrers = 100; // Starting with 100 active referrers
        let cumulativeReferrals = []; // To store cumulative expected referrals each day
        let totalReferrals = 0; // Total referrals made so far

        // Initializing referrer capacities for each active referrer
        for (let i = 0; i < activeReferrers; i++) {
            this.referrerCapacity[`Referrer${i + 1}`] = 10; // Capacity of 10 referrals
        }
        
        for (let day = 0; day < days; day++) {
            let dailyReferrals = 0;
            
            // Each active referrer has a chance to make referrals
            for (let referrer in this.referrerCapacity) {
                if (this.referrerCapacity[referrer] > 0) {
                    // Determine successful referrals for this referrer based on the probability p
                    const referralsToday = Math.min(this.referrerCapacity[referrer], Math.floor(Math.random() < p ? 1 : 0));
                    dailyReferrals += referralsToday;
                    this.referrerCapacity[referrer] -= referralsToday;
                }
            }
            
            // Increase total referrals and record cumulative totals
            totalReferrals += dailyReferrals;
            cumulativeReferrals.push(totalReferrals);
            
            // Remove inactive referrers
            activeReferrers = Object.keys(this.referrerCapacity).filter(referrer => this.referrerCapacity[referrer] > 0).length;
        }
        
        return cumulativeReferrals;
    }

    // Function to calculate minimum number of days to reach a target total
    days_to_target(p, target_total) {
        let days = 0;
        let totalReferrals = 0;
        
        // Simulate daily until we reach or exceed the target
        while (totalReferrals < target_total) {
            days++;
            let dailyReferrals = 0;
            let activeReferrers = 100; // Reset active referrers for each loop
            
            // Each active referrer has a chance to make referrals
            for (let i = 0; i < activeReferrers; i++) {
                if (this.referrerCapacity[`Referrer${i + 1}`] > 0) {
                    const referralsToday = Math.min(this.referrerCapacity[`Referrer${i + 1}`], Math.floor(Math.random() < p ? 1 : 0));
                    dailyReferrals += referralsToday;
                    this.referrerCapacity[`Referrer${i + 1}`] -= referralsToday;
                }
            }

            // Update total referrals
            totalReferrals += dailyReferrals;
        }

        return days;
    }

    // Finds the minimum bonus required to achieve the target hires
    min_bonus_for_target(days, target_hires, adoption_prob, eps) {
        let low = 0; // Start from no bonus
        let high = 10000; // Arbitrarily large bonus value for upper limit
        let result = null;

        while (high - low > eps) {
            const mid = Math.ceil((low + high) / 2 / 10) * 10; // Round up to nearest $10
            const probability = adoption_prob(mid); // Calculate probability based on bonus

            const cumulativeReferrals = this.simulate(probability, days);
            const totalReferrals = cumulativeReferrals[cumulativeReferrals.length - 1];

            if (totalReferrals >= target_hires) {
                // If we meet the target, try a lower bonus
                result = mid;
                high = mid - 10;
            } else {
                // If we don't meet the target, try a higher bonus
                low = mid + 10;
            }
        }

        return result;
    }
}

module.exports = { ReferralGraph };
