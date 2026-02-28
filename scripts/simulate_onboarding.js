/**
 * SIMULATED ONBOARDING FLOW
 * This script demonstrates how the "Strong Spec Sheet" works using the
 * `onboarding_question` and `data_type` from cat_specifications.
 */
function simulateOnboarding(variantName) {
    console.log(`\n🚀 Starting Onboarding for: ${variantName}`);
    console.log(`-------------------------------------------`);

    // Mocked Spec SOT retrieved from cat_specifications
    const specSot = [
        { key: 'displacement', question: 'What is the engine displacement in cc?', type: 'NUMERIC' },
        { key: 'max_power', question: 'What is the maximum power output (e.g. 8.3 bhp @ 6500 rpm)?', type: 'TEXT' },
        { key: 'silent_start', question: 'Does it have a silent starter (ACG)?', type: 'ENUM', allowed: ['Yes', 'No'] },
        { key: 'external_fuel', question: 'Does it have external fuel filling?', type: 'ENUM', allowed: ['Yes', 'No'] },
        { key: 'storage_litres', question: 'What is the under-seat storage capacity in Litres?', type: 'NUMERIC' },
    ];

    const onboardingData = {};

    for (const field of specSot) {
        // In a real UI, this would be the prompt given to the user
        process.stdout.write(`[PROMPT]: ${field.question}\n`);

        // Simulating user input validation based on 'type' and 'allowed' values
        let simulatedInput = '';
        if (field.key === 'displacement') simulatedInput = '123.97';
        if (field.key === 'max_power') simulatedInput = '8.3 bhp @ 6500 rpm';
        if (field.key === 'silent_start') simulatedInput = 'Yes';
        if (field.key === 'external_fuel') simulatedInput = 'Yes';
        if (field.key === 'storage_litres') simulatedInput = '18';

        process.stdout.write(`[USER INPUT]: ${simulatedInput}\n`);

        // Validation Logic
        if (field.type === 'NUMERIC' && isNaN(Number(simulatedInput))) {
            process.stdout.write(`❌ Validation Failed: Expected numeric value for ${field.key}\n`);
        } else if (field.type === 'ENUM' && field.allowed && !field.allowed.includes(simulatedInput)) {
            process.stdout.write(`❌ Validation Failed: Expected one of [${field.allowed}]\n`);
        } else {
            process.stdout.write(`✅ Validated and stored: ${simulatedInput}\n`);
            onboardingData[field.key] = simulatedInput;
        }
    }

    console.log(`\n✅ Onboarding Complete for ${variantName}`);
    console.log(`Final Spec Data:`, JSON.stringify(onboardingData, null, 2));
}

simulateOnboarding('Activa 125 Deluxe');
