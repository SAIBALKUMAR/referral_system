const { ReferralGraph } = require('../src/index.js');

// Enhanced test helpers
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

function assertArrayEquals(arr1, arr2, message) {
    const areEqual = arr1.length === arr2.length && 
        arr1.every((item, index) => item === arr2[index]);
    if (!areEqual) {
        throw new Error(message || `Arrays are not equal: ${JSON.stringify(arr1)} !== ${JSON.stringify(arr2)}`);
    }
}

function assertObjectHasProperties(obj, properties, message) {
    properties.forEach(prop => {
        if (!obj.hasOwnProperty(prop)) {
            throw new Error(message || `Object missing property: ${prop}`);
        }
    });
}

function assertInRange(value, min, max, message) {
    if (value < min || value > max) {
        throw new Error(message || `Value ${value} not in range [${min}, ${max}]`);
    }
}

function assertMonotonic(arr, increasing = true, message) {
    for (let i = 1; i < arr.length; i++) {
        if (increasing && arr[i] < arr[i-1] || !increasing && arr[i] > arr[i-1]) {
            throw new Error(message || `Array not monotonic at index ${i}: ${arr[i-1]} -> ${arr[i]}`);
        }
    }
}

function runTest(testName, testFunction) {
    console.log(`\n=== Testing ${testName} ===`);
    const startTime = Date.now();
    try {
        testFunction();
        const duration = Date.now() - startTime;
        console.log(`\n✓ All tests passed (${duration}ms)`);
        return true;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log('\n✗ Test failed:', error.message);
        console.log('Stack:', error.stack);
        console.log(`Failed after ${duration}ms`);
        return false;
    } finally {
        console.log('================\n');
    }
}

// Test Suites
let passedTests = 0;
let totalTests = 0;

// 1. Basic Operations Test Suite
totalTests++;
if (runTest('Basic Operations', () => {
    const graph = new ReferralGraph();
    
    // Test user addition
    graph.addUser('Alice');
    assert(graph.adjacencyList['Alice'] !== undefined);
    assertObjectHasProperties(graph.adjacencyList['Alice'], ['referrals', 'referrer']);
    
    // Test valid referral
    const result = graph.addReferral('Alice', 'Bob');
    assert(result === "Bob referred by Alice");
    assert(graph.adjacencyList['Alice'].referrals.includes('Bob'));
    
    // Test duplicate referral
    const dupResult = graph.addReferral('Charlie', 'Bob');
    assert(dupResult === "Candidate can only be referred by one user!");
    
    // Test cyclic referral
    graph.addReferral('Bob', 'Charlie');
    const cycleResult = graph.addReferral('Charlie', 'Alice');
    assert(cycleResult === "Cycle detected! Referral cannot be added!");
})) passedTests++;

// 2. Network Analysis Test Suite
totalTests++;
if (runTest('Network Analysis', () => {
    const graph = new ReferralGraph();
    
    // Create test network
    graph.addReferral('A', 'B');
    graph.addReferral('B', 'C');
    graph.addReferral('B', 'D');
    graph.addReferral('A', 'E');
    
    // Test reach calculations
    const aReach = graph.totalReferralCount('A');
    assert(aReach.direct === 2, "Direct referral count incorrect");
    assert(aReach.indirect === 2, "Indirect referral count incorrect");
    assert(aReach.total === 4, "Total referral count incorrect");
    
    // Test reach scores
    const aScore = graph.calculateReachScore('A');
    const bScore = graph.calculateReachScore('B');
    assert(aScore > bScore, "Root node should have higher reach score");
    
    // Test centrality
    const centrality = graph.flowCentrality();
    assert(centrality[0] === 'B', "Most central node incorrect");

    // Test unique reach expansion
    const topInfluencers = graph.uniqueReachExpansion(2);
    assert(topInfluencers.length === 2, "Should return requested number of influencers");
    assert(topInfluencers[0] === 'A', "A should be top influencer");

    // Test top referrers by reach
    const topReferrers = graph.topReferrersByReach(2);
    assert(topReferrers.length === 2, "Should return requested number of referrers");
    assertObjectHasProperties(topReferrers[0], ['user', 'score', 'details']);
    assert(topReferrers[0].user === 'A', "A should be top referrer");
    assert(topReferrers[0].score > topReferrers[1].score, "Scores should be in descending order");
    assert(topReferrers[0].details.total === 4, "Should have correct total reach");
})) passedTests++;

// 3. Growth Simulation Test Suite
totalTests++;
if (runTest('Growth Simulation', () => {
    const graph = new ReferralGraph();
    
    // Test with different probabilities
    const lowGrowth = graph.simulate(0.1, 10);
    const highGrowth = graph.simulate(0.5, 10);
    
    assert(lowGrowth.length === 10, "Incorrect simulation length");
    assert(highGrowth[9] > lowGrowth[9], "Higher probability should yield more referrals");
    
    // Test monotonic growth
    assertMonotonic(lowGrowth, true, "Growth should be monotonically increasing");
    
    // Test capacity limits
    const maxGrowth = graph.simulate(1.0, 20);
    assert(maxGrowth[19] <= 1000, "Should respect capacity limits");
    
    // Test simulation reset
    const firstSim = graph.simulate(0.5, 10);
    const secondSim = graph.simulate(0.5, 10);
    assert(Math.abs(firstSim[9] - secondSim[9]) < firstSim[9] * 0.5, 
        "Independent simulations should be roughly similar");

    // Test days to target calculation
    const daysTo50 = graph.days_to_target(0.5, 50);
    assert(typeof daysTo50 === 'number' && daysTo50 > 0, 
        "Should return positive number of days");
    const daysTo100 = graph.days_to_target(0.5, 100);
    assert(daysTo100 > daysTo50, 
        "More hires should require more days");
})) passedTests++;

// 4. Bonus Optimization Test Suite
totalTests++;
if (runTest('Bonus Optimization', () => {
    const graph = new ReferralGraph();
    
    // Test bonus calculation
    const adoptionProb = bonus => Math.min(1, 0.3 * (bonus / 1000));
    const bonus = graph.min_bonus_for_target(30, 50, adoptionProb, 1e-3);
    
    assert(typeof bonus === 'number', "Should return a numeric bonus");
    assert(bonus > 0, "Bonus should be positive");
    assert(bonus % 10 === 0, "Bonus should be rounded to nearest 10");
    
    // Test bonus effectiveness
    const probability = adoptionProb(bonus);
    const simulation = graph.simulate(probability, 30);
    assert(simulation[simulation.length - 1] >= 50, "Bonus should achieve target");
})) passedTests++;

// 5. Edge Cases Test Suite
totalTests++;
if (runTest('Edge Cases', () => {
    const graph = new ReferralGraph();
    
    // Test empty graph
    assert(graph.getReferrals('NonExistent').length === 0);
    assert(graph.calculateReachScore('NonExistent') === 0);
    
    // Test invalid inputs
    assert(graph.addReferral(null, 'Test') === "Invalid referrer or candidate!");
    assert(graph.addReferral('Test', null) === "Invalid referrer or candidate!");
    assert(graph.addReferral(undefined, 'Test') === "Invalid referrer or candidate!");
    
    // Test invalid referrals
    assert(graph.addReferral('A', 'A') === "Self-referral is not allowed!");
    
    // Test single node
    graph.addUser('Solo');
    assert(graph.totalReferralCount('Solo').total === 0);
    assert(graph.computeFullReach('Solo').length === 0);
})) passedTests++;

// Report results
console.log('\n=== Test Results ===');
console.log(`Passed: ${passedTests}/${totalTests} test suites`);
console.log(`Success Rate: ${(passedTests/totalTests*100).toFixed(2)}%`);
if (passedTests < totalTests) {
    process.exit(1);
}
