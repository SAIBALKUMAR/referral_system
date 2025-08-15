# Referral System

A comprehensive referral management system with network analysis, growth simulation, and bonus optimization capabilities.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Time Complexity Analysis](#time-complexity-analysis)
- [Space Complexity Analysis](#space-complexity-analysis)
- [Usage](#usage)
- [Running the Code](#running-the-code)
- [Testing](#testing)
- [Optimization Notes](#optimization-notes)
- [Limitations and Constraints](#limitations-and-constraints)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

## Features

1. **Basic Referral Management**
   - Add users and track referral relationships
   - Prevent cycles in referral chains
   - Validate referral constraints (no self-referrals, single referrer per candidate)

2. **Network Analysis**
   - Calculate direct and indirect referral counts
   - Compute full downstream reach for each user
   - Analyze unique reach expansion
   - Calculate flow centrality metrics

3. **Growth Simulation**
   - Simulate network growth with configurable parameters
   - Calculate minimum days to reach target hires
   - Optimize referral bonuses

## Time Complexity Analysis

### Core Operations:
1. `addUser`: O(1)
   - Simple object property assignment

2. `addReferral`: O(V + E)
   - V: number of users (vertices)
   - E: number of referral relationships (edges)
   - Includes cycle detection cost

3. `hasCycle`: O(V + E)
   - DFS traversal through the referral graph

4. `computeFullReach`: O(V + E)
   - BFS traversal for reach calculation
   - Caching improves subsequent lookups to O(1)

### Advanced Analytics:
1. `uniqueReachExpansion`: O(kV(V + E))
   - k: number of users to select
   - Each iteration requires full reach computation

2. `flowCentrality`: O(V³)
   - Computes shortest paths between all pairs
   - Analyzes centrality for each vertex

3. `totalReferralCount`: O(V + E)
   - BFS traversal for counting referrals

### Simulation:
1. `simulate`: O(D × R)
   - D: number of days
   - R: number of active referrers

2. `min_bonus_for_target`: O(log(M) × D × R)
   - M: maximum bonus amount
   - Uses binary search over bonus range

## Space Complexity Analysis

1. **Base Data Structure**:
   - Adjacency List: O(V + E)
   - Reach Cache: O(V²) in worst case

2. **Temporary Storage**:
   - BFS/DFS visited sets: O(V)
   - Path computation: O(V)
   - Simulation results: O(D) for D days

## Usage

1. **Basic Setup**:
```javascript
const referralGraph = new ReferralGraph();
```

2. **Adding Referrals**:
```javascript
referralGraph.addReferral('Sahil', 'Riya');
referralGraph.addReferral('Riya', 'Mridul');
```

3. **Analyzing Network**:
```javascript
// Get total referrals
const referrals = referralGraph.totalReferralCount('Sahil');

// Find top influencers
const topUsers = referralGraph.uniqueReachExpansion(2);
```

4. **Running Simulations and Analysis**:
```javascript
// Basic Growth Simulation (30 days, 30% success probability)
const growth = referralGraph.simulate(0.3, 30);
console.log('Network growth over 30 days:', growth);

// Bonus Optimization
const minBonus = referralGraph.min_bonus_for_target(30, 50, adoption_prob, 1e-3);
console.log('Minimum bonus needed for 50 hires:', minBonus);

// Network Analytics
// Check total reach (direct + indirect)
const sahilReach = referralGraph.totalReferralCount('Sahil');
console.log('Sahil\'s total reach:', sahilReach);

// Find top influencers (top 2 by reach)
const topInfluencers = referralGraph.uniqueReachExpansion(2);
console.log('Top influencers:', topInfluencers);

// Analyze network centrality
const centralUsers = referralGraph.flowCentrality();
console.log('Users by centrality:', centralUsers);

// Advanced Simulations
// High growth scenario (50% success rate)
const aggressiveGrowth = referralGraph.simulate(0.5, 30);
console.log('Aggressive growth scenario:', aggressiveGrowth[29], 'total referrals');

// Conservative scenario (20% success rate)
const conservativeGrowth = referralGraph.simulate(0.2, 30);
console.log('Conservative growth scenario:', conservativeGrowth[29], 'total referrals');
```

## Running the Code

1. Ensure Node.js is installed on your system
2. Navigate to the project directory:
   ```bash
   cd "Referral System"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the main file:
   ```bash
   npm start
   ```

## Optimization Notes

1. The reach cache improves performance for repeated reach calculations
2. Binary search is used for efficient bonus optimization
3. Adjacency list representation provides efficient graph traversal
4. BFS/DFS algorithms are optimized for large networks

## Limitations and Constraints

1. Maximum referral capacity per user: 10
2. No circular referrals allowed
3. Single referrer per candidate
4. Assumes synchronous referral processing

## Future Improvements

1. Add database persistence
2. Implement real-time analytics
3. Add more sophisticated bonus optimization algorithms
4. Include historical tracking and trending

## Testing

Run the test suite to verify all functionality:

```bash
cd "Referral System"
node src/tests.js
```

The test suite includes:
- Basic referral operations
- Network analytics
- Growth simulation
- Bonus optimization
- Edge cases and error handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
