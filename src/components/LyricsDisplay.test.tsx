import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LyricsDisplay from './LyricsDisplay'

// Mock the convexQuery function
vi.mock('@convex-dev/react-query', () => ({
  convexQuery: vi.fn(() => ({
    queryKey: ['lyrics', 'test-song-id'],
    queryFn: vi.fn(),
  })),
}))

// Mock useSuspenseQuery to return mock lyrics data
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useSuspenseQuery: vi.fn(() => ({
      data: [
        {
          _id: 'lyric1',
          songId: 'test-song-id',
          lineNumber: 1,
          startTime: 14.81,
          endTime: 17.46,
          original: 'برای توی کوچه رقصیدن',
          transliteration: 'Barāye tūye kūche raqsidan',
          hebrew: 'בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן',
          english: 'For dancing in the alley',
        },
        {
          _id: 'lyric2',
          songId: 'test-song-id',
          lineNumber: 2,
          startTime: 17.46,
          endTime: 20.91,
          original: 'برای ترسیدن به وقت بوسیدن',
          transliteration: 'Barāye tarsidan be vaqt-e būsidan',
          hebrew: 'בָּרָאיֶה טַרְסִידַן בֶּה וַקְטֶה בּוּסִידַן',
          english: 'For being afraid at the moment of kissing',
        },
        {
          _id: 'lyric3',
          songId: 'test-song-id',
          lineNumber: 3,
          startTime: 20.91,
          endTime: 24.63,
          original: 'برای خواهرم خواهرت خواهرامون',
          transliteration: 'Barāye khāharam khāharet khāharāmūn',
          // No Hebrew for this line to test optional field
          english: 'For my sister, your sister, our sisters',
        },
      ],
    })),
  }
})

// Create a wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('LyricsDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all language versions by default', () => {
    render(<LyricsDisplay songId={'test-song-id' as never}  />, {
      wrapper: createWrapper(),
    })

    // Check Persian text is rendered
    expect(screen.getByText('برای توی کوچه رقصیدن')).toBeInTheDocument()

    // Check transliteration is rendered
    expect(screen.getByText('Barāye tūye kūche raqsidan')).toBeInTheDocument()

    // Check Hebrew is rendered (for lines that have it)
    expect(screen.getByText('בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן')).toBeInTheDocument()

    // Check English is rendered
    expect(screen.getByText('For dancing in the alley')).toBeInTheDocument()
  })

  it('renders multiple lines sorted by lineNumber', () => {
    render(<LyricsDisplay songId={'test-song-id' as never}  />, {
      wrapper: createWrapper(),
    })

    // All 3 lines should be rendered
    expect(screen.getByText('For dancing in the alley')).toBeInTheDocument()
    expect(screen.getByText('For being afraid at the moment of kissing')).toBeInTheDocument()
    expect(screen.getByText('For my sister, your sister, our sisters')).toBeInTheDocument()
  })

  it('calls onLineClick with startTime and index when line is clicked', () => {
    const onLineClick = vi.fn()

    render(
      <LyricsDisplay songId={'test-song-id' as never}  onLineClick={onLineClick} />,
      { wrapper: createWrapper() }
    )

    // Click the first line
    const firstLine = screen.getByText('For dancing in the alley').closest('button')
    if (firstLine) {
      fireEvent.click(firstLine)
    }

    expect(onLineClick).toHaveBeenCalledWith(14.81, 0)
  })

  it('applies active highlight class to active line', () => {
    render(
      <LyricsDisplay songId={'test-song-id' as never}  activeLineIndex={1} />,
      { wrapper: createWrapper() }
    )

    // The second line (index 1) should have the highlight class on the outer container div
    const button = screen.getByText('For being afraid at the moment of kissing').closest('button')
    const lineContainer = button?.parentElement
    expect(lineContainer).toHaveClass('bg-primary/10')
    expect(lineContainer).toHaveClass('ring-1')
    expect(lineContainer).toHaveClass('ring-primary/20')
  })

  it('applies click animation class to clicked line', () => {
    render(
      <LyricsDisplay songId={'test-song-id' as never}  clickedLineIndex={0} />,
      { wrapper: createWrapper() }
    )

    // The click animation class is on the outer container div, not the button
    const button = screen.getByText('For dancing in the alley').closest('button')
    const lineContainer = button?.parentElement
    expect(lineContainer).toHaveClass('scale-[0.98]')
    expect(lineContainer).toHaveClass('bg-primary/20')
  })

  describe('Language Filter', () => {
    it('shows only Persian when filter is "persian"', () => {
      render(
        <LyricsDisplay songId={'test-song-id' as never}  languageFilter="persian" />,
        { wrapper: createWrapper() }
      )

      // Persian should be visible
      expect(screen.getByText('برای توی کوچه رقصیدن')).toBeInTheDocument()

      // Other languages should NOT be visible
      expect(screen.queryByText('Barāye tūye kūche raqsidan')).not.toBeInTheDocument()
      expect(screen.queryByText('בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן')).not.toBeInTheDocument()
      expect(screen.queryByText('For dancing in the alley')).not.toBeInTheDocument()
    })

    it('shows only Transliteration when filter is "transliteration"', () => {
      render(
        <LyricsDisplay songId={'test-song-id' as never}  languageFilter="transliteration" />,
        { wrapper: createWrapper() }
      )

      // Transliteration should be visible
      expect(screen.getByText('Barāye tūye kūche raqsidan')).toBeInTheDocument()

      // Other languages should NOT be visible
      expect(screen.queryByText('برای توی کوچه رقصیدن')).not.toBeInTheDocument()
      expect(screen.queryByText('בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן')).not.toBeInTheDocument()
      expect(screen.queryByText('For dancing in the alley')).not.toBeInTheDocument()
    })

    it('shows only Hebrew when filter is "hebrew"', () => {
      render(
        <LyricsDisplay songId={'test-song-id' as never}  languageFilter="hebrew" />,
        { wrapper: createWrapper() }
      )

      // Hebrew should be visible (for lines that have it)
      expect(screen.getByText('בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן')).toBeInTheDocument()

      // Other languages should NOT be visible
      expect(screen.queryByText('برای توی کوچه رقصیدن')).not.toBeInTheDocument()
      expect(screen.queryByText('Barāye tūye kūche raqsidan')).not.toBeInTheDocument()
      expect(screen.queryByText('For dancing in the alley')).not.toBeInTheDocument()
    })

    it('shows only English when filter is "english"', () => {
      render(
        <LyricsDisplay songId={'test-song-id' as never}  languageFilter="english" />,
        { wrapper: createWrapper() }
      )

      // English should be visible
      expect(screen.getByText('For dancing in the alley')).toBeInTheDocument()

      // Other languages should NOT be visible
      expect(screen.queryByText('برای توی کوچه رقصیدن')).not.toBeInTheDocument()
      expect(screen.queryByText('Barāye tūye kūche raqsidan')).not.toBeInTheDocument()
      expect(screen.queryByText('בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן')).not.toBeInTheDocument()
    })

    it('shows all languages when filter is "all"', () => {
      render(
        <LyricsDisplay songId={'test-song-id' as never}  languageFilter="all" />,
        { wrapper: createWrapper() }
      )

      // All languages should be visible
      expect(screen.getByText('برای توی کوچه رقصیدن')).toBeInTheDocument()
      expect(screen.getByText('Barāye tūye kūche raqsidan')).toBeInTheDocument()
      expect(screen.getByText('בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן')).toBeInTheDocument()
      expect(screen.getByText('For dancing in the alley')).toBeInTheDocument()
    })
  })

  it('handles lines without Hebrew text gracefully', () => {
    render(
      <LyricsDisplay songId={'test-song-id' as never}  languageFilter="all" />,
      { wrapper: createWrapper() }
    )

    // Line 3 has no Hebrew - should still render other languages
    expect(screen.getByText('برای خواهرم خواهرت خواهرامون')).toBeInTheDocument()
    expect(screen.getByText('Barāye khāharam khāharet khāharāmūn')).toBeInTheDocument()
    expect(screen.getByText('For my sister, your sister, our sisters')).toBeInTheDocument()
  })

  it('applies correct RTL direction to Persian text', () => {
    render(<LyricsDisplay songId={'test-song-id' as never}  />, {
      wrapper: createWrapper(),
    })

    const persianText = screen.getByText('برای توی کوچه رقصیدن')
    expect(persianText).toHaveAttribute('dir', 'rtl')
    expect(persianText).toHaveClass('text-right')
  })

  it('applies correct RTL direction to Hebrew text', () => {
    render(<LyricsDisplay songId={'test-song-id' as never}  />, {
      wrapper: createWrapper(),
    })

    const hebrewText = screen.getByText('בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן')
    expect(hebrewText).toHaveAttribute('dir', 'rtl')
    expect(hebrewText).toHaveClass('text-right')
  })

  it('applies italic and green color to transliteration', () => {
    render(<LyricsDisplay songId={'test-song-id' as never}  />, {
      wrapper: createWrapper(),
    })

    const translitText = screen.getByText('Barāye tūye kūche raqsidan')
    expect(translitText).toHaveClass('italic')
    expect(translitText).toHaveClass('text-emerald-500')
  })

  it('applies blue color to Hebrew text', () => {
    render(<LyricsDisplay songId={'test-song-id' as never}  />, {
      wrapper: createWrapper(),
    })

    const hebrewText = screen.getByText('בָּרָאיֶה טוּיֶה כּוּצֶ׳ה רַקְסִידַן')
    expect(hebrewText).toHaveClass('text-blue-500')
  })

  it('applies gray color to English text', () => {
    render(<LyricsDisplay songId={'test-song-id' as never}  />, {
      wrapper: createWrapper(),
    })

    const englishText = screen.getByText('For dancing in the alley')
    expect(englishText).toHaveClass('text-gray-400')
  })
})
