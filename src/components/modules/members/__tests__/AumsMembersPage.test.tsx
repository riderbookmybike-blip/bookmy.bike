/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AumsMembersPage from '../AumsMembersPage';
import {
    getAllPlatformMembers,
    getPlatformPresenceSummary,
    getPlatformTemperatureSummary,
    getLiveMembersWithDetails,
    getPresenceForPage,
} from '@/actions/aums-presence';

// Mock all external dependencies
jest.mock('@/actions/aums-presence', () => ({
    getAllPlatformMembers: jest.fn(),
    getPlatformPresenceSummary: jest.fn(),
    getPlatformTemperatureSummary: jest.fn(),
    getLiveMembersWithDetails: jest.fn(),
    getPresenceForPage: jest.fn(),
}));

jest.mock('@/hooks/useBreakpoint', () => ({
    useBreakpoint: () => ({ device: 'desktop' }),
}));

// Provide a stable mocked layout environment
jest.mock('next/navigation', () => ({
    usePathname: () => '/aums/members',
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

describe('AumsMembersPage Temperature Tabs UI', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (getPlatformPresenceSummary as jest.Mock).mockResolvedValue({ liveNowCount: 5, active1hCount: 10 });
        (getPlatformTemperatureSummary as jest.Mock).mockResolvedValue({ HOT: 2, WARM: 3, COLD: 1 });
        (getLiveMembersWithDetails as jest.Mock).mockResolvedValue([]);
        (getPresenceForPage as jest.Mock).mockResolvedValue([]);

        // Default list of mock members
        (getAllPlatformMembers as jest.Mock).mockResolvedValue({
            data: [
                {
                    id: 'uuid-1',
                    display_id: 'MEM-001',
                    full_name: 'Test Member 1',
                    created_at: '2026-03-24T10:00:00Z',
                    visitor_temperature: 'HOT',
                },
            ],
            metadata: { total: 1, totalPages: 1 },
        });
    });

    it('should call getAllPlatformMembers with "hot" filter and render the paginated row consistently', async () => {
        render(<AumsMembersPage />);

        // Wait for initial render data fetch (All Tab)
        await waitFor(() => {
            expect(getAllPlatformMembers).toHaveBeenCalledWith('', 1, 50, 'Maharashtra', 'all');
        });

        // Ensure rows are rendered
        expect(await screen.findByText(/Test Member 1/i)).toBeTruthy();

        // Simulate switching to 'Hot' tab
        const hotTab = await screen.findByText('Hot');

        // Changing mock return to simulate a different user specifically for the Hot tab
        (getAllPlatformMembers as jest.Mock).mockResolvedValue({
            data: [
                {
                    id: 'uuid-2',
                    display_id: 'MEM-002',
                    full_name: 'Hot Prospect',
                    created_at: '2026-03-24T11:00:00Z',
                    visitor_temperature: 'HOT',
                },
            ],
            metadata: { total: 1, totalPages: 1 },
        });

        fireEvent.click(hotTab);

        // Verify state changes triggered a new fetch with the direct 'hot' string parameter
        await waitFor(() => {
            expect(getAllPlatformMembers).toHaveBeenCalledWith('', 1, 50, 'Maharashtra', 'hot');
        });

        // Ensure new table rows render properly decoupled from active arrays
        expect(await screen.findByText(/Hot Prospect/i)).toBeTruthy();
    });
});
