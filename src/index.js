class ReferralGraph {
  constructor() {
    this.adjacencyList = {}; // To store users and their referrals
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
    if (referrer === candidate) {
      return "Self-referral is not allowed!";
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

  // Method to get top referrers by reach
  topReferrersByReach(k) {
    const reachCounts = [];

    for (const user in this.adjacencyList) {
      const totalCount = this.totalReferralCount(user);
      reachCounts.push({ user, count: totalCount });
    }

    // Sort the reach counts in descending order
    reachCounts.sort((a, b) => b.count - a.count);

    // Return the top k referrers based on their reach
    return reachCounts.slice(0, k);
  }
}

// Usage Example
const referralGraph = new ReferralGraph();

referralGraph.addReferral('Sahil', 'Riya'); // Riya referred by Sahil
referralGraph.addReferral('Riya', 'Mridul'); // Mridul referred by Riya
referralGraph.addReferral('Mridul', 'Pavan'); // Pavan referred by Mridul
referralGraph.addReferral('Sahil', 'Raveesh'); // Raveesh referred by Sahil
referralGraph.addReferral('Raveesh', 'Maruthi'); // Maruthi referred by Raveesh

console.log(referralGraph.totalReferralCount('Sahil')); // 5 (Riya, Mridul, Pavan, Raveesh, Maruthi)
console.log(referralGraph.totalReferralCount('Riya')); // 3 (Mridul, Pavan)
console.log(referralGraph.totalReferralCount('Mridul')); // 1 (Pavan)

console.log(referralGraph.topReferrersByReach(2)); 
// Top 2 referrers ranked by reach
/*
Output Example:
[
  { user: 'Sahil', count: 5 },
  { user: 'Riya', count: 3 }
]
*/

// Note for k selection: 
// The caller should choose k based on how many referrers they want insight into.
// A higher k will provide more referrers but may include those with very few indirect referrals.
