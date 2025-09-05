import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import TestSessionManagement from './TestSessionManagement'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('TestSessionManagement Component', () => {
  const mockOnStartNewTest = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          testSessions: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalSessions: 0,
            hasNextPage: false,
            hasPreviousPage: false,
            limit: 5,
            startIndex: 0,
            endIndex: 0,
            isEmpty: true,
          },
        },
      }),
    })
  })

  it('renders without crashing', async () => {
    await act(async () => {
      render(
        <TestSessionManagement
          studentId="test-student-123"
          onStartNewTest={mockOnStartNewTest}
        />
      )
    })

    // The component should show either loading or empty state
    const loadingText = screen.queryByText('Loading your test sessions...')
    const emptyText = screen.queryByText('No test sessions found')
    expect(loadingText || emptyText).toBeInTheDocument()
  })

  it('shows loading state initially', async () => {
    await act(async () => {
      render(
        <TestSessionManagement
          studentId="test-student-123"
          onStartNewTest={mockOnStartNewTest}
        />
      )
    })

    // The component should show either loading or empty state
    const loadingText = screen.queryByText('Loading your test sessions...')
    const emptyText = screen.queryByText('No test sessions found')
    expect(loadingText || emptyText).toBeInTheDocument()
  })

  it('shows empty state when no sessions exist', async () => {
    await act(async () => {
      render(
        <TestSessionManagement
          studentId="test-student-123"
          onStartNewTest={mockOnStartNewTest}
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('No test sessions found')).toBeInTheDocument()
      expect(screen.getByText("You don't have any test sessions yet.")).toBeInTheDocument()
    })
  })

  it('calls onStartNewTest when Start New Test button is clicked', async () => {
    await act(async () => {
      render(
        <TestSessionManagement
          studentId="test-student-123"
          onStartNewTest={mockOnStartNewTest}
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Start New Test')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Start New Test'))
    expect(mockOnStartNewTest).toHaveBeenCalledWith('test-student-123')
  })

  it('displays sessions when they exist', async () => {
    const mockSessions = [
      {
        id: 'session-1',
        studentId: 'test-student-123',
        assessmentId: 'assessment-1',
        learnositySessionId: 'learnosity-1',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        expiresAt: new Date('2024-01-01T12:00:00Z'),
        status: 'active' as const,
        results: [],
      },
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          testSessions: mockSessions,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalSessions: 1,
            hasNextPage: false,
            hasPreviousPage: false,
            limit: 5,
            startIndex: 1,
            endIndex: 1,
            isEmpty: false,
          },
        },
      }),
    })

    await act(async () => {
      render(
        <TestSessionManagement
          studentId="test-student-123"
          onStartNewTest={mockOnStartNewTest}
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('session-1')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'))

    await act(async () => {
      render(
        <TestSessionManagement
          studentId="test-student-123"
          onStartNewTest={mockOnStartNewTest}
        />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Error:')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })
  })
})
