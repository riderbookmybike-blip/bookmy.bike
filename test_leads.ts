import { getLeads } from './src/actions/crm';

async function test() {
    console.log('Testing getLeads with undefined...');
    try {
        const leads = await getLeads(undefined);
        console.log('Leads fetched:', leads.length);
        console.log('First lead:', leads[0]);
    } catch (e) {
        console.error('Error fetching leads:', e);
    }
}

test();
