// Import the ReferralGraph class
const { ReferralGraph } = require('./index.js');

// Test Helpers
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

function assertArrayEquals(arr1, arr2, message) {
    assert(
        arr1.length === arr2.length && 
        arr1.every((item, index) => item === arr2[index]),
        message || `Arrays are not equal: ${JSON.stringify(arr1)} !== ${JSON.stringify(arr2)}`
    );
}

function assertObjectHasProperties(obj, properties, message) {
    properties.forEach(prop => {
        assert(obj.hasOwnProperty(prop), 
            message || `Object missing property: ${prop}`);
    });
}

function runTest(testName, testFunction) {
    console.log(`\n=== Testing ${testName} ===`);
    try {
        testFunction();
        console.log('\n✓ All tests passed');
    } catch (error) {
        console.log('\n✗ Test failed:', error.message);
        console.log('Stack:', error.stack);
    }
    console.log('================\n');
}

// 1. Test Basic Referral Operations
runTest('Basic Referral Operations', () => {
    const testGraph = new ReferralGraph();
    
    // Test user addition
    testGraph.addUser('Sahil');
    assert(testGraph.adjacencyList['Sahil'] !== undefined, 
        "User should be added to adjacency list");
    assertObjectHasProperties(testGraph.adjacencyList['Sahil'], 
        ['referrals', 'referrer'], 
        "User object should have required properties");

    // Test valid referrals
    const result1 = testGraph.addReferral('Sahil', 'Riya');
    assert(result1 === "Riya referred by Sahil", 
        "Should return success message for valid referral");
    assert(testGraph.adjacencyList['Sahil'].referrals.includes('Riya'), 
        "Referral should be added to referrer's list");
    assert(testGraph.adjacencyList['Riya'].referrer === 'Sahil',
        "Referrer should be set for the candidate");

    // Test referral constraints
    const selfReferral = testGraph.addReferral('Sahil', 'Sahil');
    assert(selfReferral === "Self-referral is not allowed!",
        "Should prevent self-referrals");

    const doubleReferral = testGraph.addReferral('Mridul', 'Riya');
    assert(doubleReferral === "Candidate can only be referred by one user!",
        "Should prevent double referrals");

    // Test referral retrieval
    const sahilReferrals = testGraph.getReferrals('Sahil');
    assertArrayEquals(sahilReferrals, ['Riya'],
        "Should return correct referral list");

    const nonExistentReferrals = testGraph.getReferrals('NonExistent');
    assertArrayEquals(nonExistentReferrals, [],
        "Should return empty array for non-existent user");

    // Test multi-level referrals
    testGraph.addReferral('Riya', 'Pavan');
    testGraph.addReferral('Riya', 'Karan');
    const riyaReferrals = testGraph.getReferrals('Riya');
    assert(riyaReferrals.length === 2,
        "Should handle multiple referrals from same user");
    
    // Test referral chain validation
    const result2 = testGraph.addReferral('Pavan', 'Sahil');
    assert(result2 === "Cycle detected! Referral cannot be added.",
        "Should detect and prevent referral cycles");
});

// 2. Test Network Analytics
runTest('Network Analytics', () => {
    const testGraph = new ReferralGraph();
    
    // Setup test network
    testGraph.addReferral('Sahil', 'Riya');
    testGraph.addReferral('Riya', 'Mridul');
    testGraph.addReferral('Sahil', 'Pavan');
    testGraph.addReferral('Pavan', 'Gina');
    testGraph.addReferral('Riya', 'Dev');
    
    // Test unique reach expansion
    const topInfluencers = testGraph.uniqueReachExpansion(2);
    assert(topInfluencers.includes('Sahil'),
        "Sahil should be a top influencer due to network coverage");
    assert(topInfluencers.length === 2,
        "Should return exactly 2 top influencers");

    // Test reach metrics
    const sahilReach = testGraph.totalReferralCount('Sahil');
    assert(sahilReach.direct === 2,
        "Sahil should have 2 direct referrals");
    assert(sahilReach.indirect === 3,
        "Sahil should have 3 indirect referrals");
    assert(sahilReach.total === 5,
        "Sahil's total reach should be 5");

    // Test flow centrality
    const centralityRanking = testGraph.flowCentrality();
    assert(centralityRanking[0] === 'Riya',
        "Riya should be most central due to network position");
    
    // Test computeFullReach
    const sahilNetwork = testGraph.computeFullReach('Sahil');
    assert(sahilNetwork.length === 5,
        "Sahil's full network should include all downstream users");
    assert(sahilNetwork.includes('Riya') && sahilNetwork.includes('Mridul'),
        "Full reach should include all levels of connections");

    // Test reach score calculation
    const sahilScore = testGraph.calculateReachScore('Sahil');
    const rivaScore = testGraph.calculateReachScore('Riya');
    assert(sahilScore > rivaScore,
        "Sahil's reach score should be higher due to larger network");

    // Test non-existent user
    const nonExistentReach = testGraph.totalReferralCount('NonExistent');
    assert(nonExistentReach.total === 0,
        "Non-existent user should have zero reach");
});

// 3. Test Growth Simulation
runTest('Growth Simulation', () => {
    const testGraph = new ReferralGraph();
    
    // Test low probability scenario
    const lowProbGrowth = testGraph.simulate(0.1, 10);
    assert(Array.isArray(lowProbGrowth),
        "Simulation should return array of cumulative referrals");
    assert(lowProbGrowth.length === 10,
        "Should have data for all 10 days");
    assert(lowProbGrowth.every((val, i) => i === 0 || val >= lowProbGrowth[i-1]),
        "Cumulative referrals should be non-decreasing");

    // Test medium probability scenario
    const medProbGrowth = testGraph.simulate(0.3, 10);
    assert(medProbGrowth[9] > lowProbGrowth[9],
        "Higher probability should lead to more referrals");

    // Test high probability scenario
    const highProbGrowth = testGraph.simulate(0.5, 10);
    assert(highProbGrowth[9] > medProbGrowth[9],
        "Highest probability should lead to most referrals");

    // Test referrer capacity limits
    const maxCapTest = testGraph.simulate(1.0, 5); // Maximum probability
    const lastDay = maxCapTest[maxCapTest.length - 1];
    assert(lastDay <= 1000, // 100 referrers * 10 capacity
        "Total referrals should not exceed maximum capacity");

    // Test days to target calculation
    const daysTo50 = testGraph.days_to_target(0.3, 50);
    assert(typeof daysTo50 === 'number' && daysTo50 > 0,
        "Should return positive number of days");

    const daysTo100 = testGraph.days_to_target(0.3, 100);
    assert(daysTo100 > daysTo50,
        "Higher target should require more days");

    // Test edge cases
    const zeroProb = testGraph.simulate(0, 10);
    assert(zeroProb.every(val => val === 0),
        "Zero probability should result in no referrals");

    const singleDay = testGraph.simulate(0.3, 1);
    assert(singleDay.length === 1,
        "Single day simulation should return array of length 1");
});

// 4. Test Bonus Optimization
runTest('Bonus Optimization', () => {
    const testGraph = new ReferralGraph();
    function testAdoptionProb(bonus) {
        return Math.min(1, 0.3 * (bonus / 1000));
    }
    
    // Test basic bonus optimization
    const minBonus50 = testGraph.min_bonus_for_target(30, 50, testAdoptionProb, 1e-3);
    assert(typeof minBonus50 === 'number' && minBonus50 > 0,
        "Should return positive bonus amount");
    assert(minBonus50 % 10 === 0,
        "Bonus should be rounded to nearest $10");

    // Test increasing targets require higher bonuses
    const minBonus100 = testGraph.min_bonus_for_target(30, 100, testAdoptionProb, 1e-3);
    assert(minBonus100 > minBonus50,
        "Higher target should require larger bonus");

    // Test shorter timeframe requires higher bonus
    const minBonus50Fast = testGraph.min_bonus_for_target(15, 50, testAdoptionProb, 1e-3);
    assert(minBonus50Fast > minBonus50,
        "Shorter timeframe should require larger bonus");

    // Test effect of adoption probability function
    function lowAdoptionProb(bonus) {
        return Math.min(1, 0.15 * (bonus / 1000)); // Half the original rate
    }
    const minBonusLowAdoption = testGraph.min_bonus_for_target(30, 50, lowAdoptionProb, 1e-3);
    assert(minBonusLowAdoption > minBonus50,
        "Lower adoption probability should require larger bonus");

    // Test edge cases
    const impossibleTarget = testGraph.min_bonus_for_target(1, 1000, testAdoptionProb, 1e-3);
    assert(impossibleTarget === null || impossibleTarget > 10000,
        "Impossible targets should return null or very high bonus");

    // Test optimization precision
    const minBonus20 = testGraph.min_bonus_for_target(30, 20, testAdoptionProb, 1e-3);
    const probability = testAdoptionProb(minBonus20);
    const simulation = testGraph.simulate(probability, 30);
    assert(simulation[simulation.length - 1] >= 20,
        "Optimized bonus should achieve target in simulation");
});

// Run example scenarios
console.log('\n=== Running Example Scenarios ===');

const referralGraph = new ReferralGraph();

// Example adoption probability function
function adoption_prob(bonus) {
    return Math.min(1, 0.3 * (bonus / 1000));
}

// Scenario 1: Short-term aggressive hiring
const scenario1 = {
    targetHires: 100,
    days: 15,
    eps: 1e-3
};
const bonus1 = referralGraph.min_bonus_for_target(
    scenario1.days, 
    scenario1.targetHires, 
    adoption_prob, 
    scenario1.eps
);
console.log('\nShort-term Aggressive Hiring Results:');
console.log(`Target: ${scenario1.targetHires} hires in ${scenario1.days} days`);
console.log(`Recommended bonus: $${bonus1}`);

// Scenario 2: Medium-term moderate hiring
const scenario2 = {
    targetHires: 50,
    days: 30,
    eps: 1e-3
};
const bonus2 = referralGraph.min_bonus_for_target(
    scenario2.days, 
    scenario2.targetHires, 
    adoption_prob, 
    scenario2.eps
);
console.log('\nMedium-term Moderate Hiring Results:');
console.log(`Target: ${scenario2.targetHires} hires in ${scenario2.days} days`);
console.log(`Recommended bonus: $${bonus2}`);

// 7. Test Edge Cases and Error Handling
runTest('Edge Cases and Error Handling', () => {
    const testGraph = new ReferralGraph();
    
    // Test empty graph operations
    assert(testGraph.getReferrals('NonExistent').length === 0,
        "Should handle non-existent users gracefully");
    assert(testGraph.calculateReachScore('NonExistent') === 0,
        "Should return 0 reach score for non-existent users");
    assert(testGraph.computeFullReach('NonExistent').length === 0,
        "Should return empty reach set for non-existent users");

    // Test single-node operations
    testGraph.addUser('Solo');
    assert(testGraph.adjacencyList['Solo'].referrals.length === 0,
        "New user should have no referrals");
    assert(testGraph.totalReferralCount('Solo').total === 0,
        "Solo user should have no referral count");

    // Test invalid referral attempts
    const nullReferrer = testGraph.addReferral(null, 'Test');
    assert(typeof nullReferrer === 'string' && nullReferrer.includes('error'),
        "Should handle null referrer gracefully");

    // Test maximum capacity
    const maxReferrals = 10;
    const referrer = 'MaxTester';
    for (let i = 0; i < maxReferrals + 5; i++) {
        testGraph.addReferral(referrer, `Candidate${i}`);
    }
    assert(testGraph.getReferrals(referrer).length <= maxReferrals,
        "Should respect maximum referral capacity");
});

// 8. Test Complex Network Scenarios
runTest('Complex Network Scenarios', () => {
    const testGraph = new ReferralGraph();
    
    // Create a complex network structure
    // Level 1
    testGraph.addReferral('Root', 'A1');
    testGraph.addReferral('Root', 'A2');
    testGraph.addReferral('Root', 'A3');
    
    // Level 2
    testGraph.addReferral('A1', 'B1');
    testGraph.addReferral('A1', 'B2');
    testGraph.addReferral('A2', 'B3');
    testGraph.addReferral('A3', 'B4');
    
    // Level 3
    testGraph.addReferral('B1', 'C1');
    testGraph.addReferral('B2', 'C2');
    testGraph.addReferral('B3', 'C3');
    testGraph.addReferral('B4', 'C4');

    // Test deep network metrics
    const rootReach = testGraph.totalReferralCount('Root');
    assert(rootReach.direct === 3,
        "Root should have 3 direct referrals");
    assert(rootReach.indirect === 8,
        "Root should have 8 indirect referrals");
    
    // Test influence distribution
    const topInfluencers = testGraph.uniqueReachExpansion(3);
    assert(topInfluencers[0] === 'Root',
        "Root should be the most influential");
    assert(topInfluencers.length === 3,
        "Should identify top 3 influencers");

    // Test centrality in complex network
    const centrality = testGraph.flowCentrality();
    assert(centrality.indexOf('Root') !== -1,
        "Root should be among central nodes");
    
    // Test reach score distribution
    const scores = ['Root', 'A1', 'B1'].map(user => 
        testGraph.calculateReachScore(user));
    assert(scores[0] > scores[1] && scores[1] > scores[2],
        "Reach scores should decrease with network depth");
});

// 9. Test Growth Patterns
runTest('Growth Patterns', () => {
    const testGraph = new ReferralGraph();
    
    // Test growth with varying probabilities
    const probabilities = [0.1, 0.3, 0.5, 0.7, 0.9];
    let lastGrowth = 0;
    
    probabilities.forEach(p => {
        const growth = testGraph.simulate(p, 20);
        assert(growth.length === 20,
            "Should simulate exact number of days");
        assert(growth[19] >= lastGrowth,
            "Higher probability should lead to more growth");
        lastGrowth = growth[19];
    });

    // Test growth stability
    const stabilityTest = testGraph.simulate(0.5, 100);
    const growthRates = stabilityTest.map((val, i) => 
        i > 0 ? val - stabilityTest[i-1] : val);
    
    // Growth rate should eventually stabilize or decrease
    const lateRates = growthRates.slice(-20);
    const earlyRates = growthRates.slice(0, 20);
    assert(Math.max(...lateRates) <= Math.max(...earlyRates),
        "Growth rate should not increase in later stages");

    // Test capacity constraints
    const maxProbGrowth = testGraph.simulate(1.0, 50);
    assert(maxProbGrowth[49] <= 1000,
        "Growth should respect system capacity");
});

// 10. Test Bonus Optimization Strategies
runTest('Bonus Optimization Strategies', () => {
    const testGraph = new ReferralGraph();

    // Test different adoption probability functions
    const adoptionFunctions = {
        linear: bonus => Math.min(1, bonus / 2000),
        exponential: bonus => Math.min(1, 1 - Math.exp(-bonus / 1000)),
        stepwise: bonus => bonus < 500 ? 0.1 : bonus < 1000 ? 0.3 : 0.5
    };

    // Test each adoption function
    Object.entries(adoptionFunctions).forEach(([type, func]) => {
        const bonus = testGraph.min_bonus_for_target(30, 50, func, 1e-3);
        assert(typeof bonus === 'number' && bonus > 0,
            `${type} function should find valid bonus`);
        
        const probability = func(bonus);
        const simulation = testGraph.simulate(probability, 30);
        assert(simulation[simulation.length - 1] >= 50,
            `${type} function should achieve target`);
    });

    // Test optimization with different timeframes
    const timeframes = [15, 30, 60];
    let lastBonus = Infinity;
    
    timeframes.forEach(days => {
        const bonus = testGraph.min_bonus_for_target(
            days, 
            50, 
            adoptionFunctions.linear, 
            1e-3
        );
        assert(bonus <= lastBonus,
            "Longer timeframe should need same or lower bonus");
        lastBonus = bonus;
    });

    // Test target scaling
    const targets = [20, 40, 80];
    let prevBonus = 0;
    
    targets.forEach(target => {
        const bonus = testGraph.min_bonus_for_target(
            30,
            target,
            adoptionFunctions.linear,
            1e-3
        );
        assert(bonus > prevBonus,
            "Higher targets should require larger bonuses");
        prevBonus = bonus;
    });
});
