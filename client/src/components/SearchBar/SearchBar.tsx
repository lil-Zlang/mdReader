import { useEffect, useState, useRef } from "react";
import styles from "./SearchBar.module.css";

interface SearchResult {
  fileId: string;
  fileName: string;
  matches: Array<{
    lineNumber: number;
    lineContent: string;
    context: string;
  }>;
  score: number;
}

interface SearchBarProps {
  onResultsChange?: (results: SearchResult[]) => void;
  onNavigate?: (fileId: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export default function SearchBar({
  onResultsChange,
  onNavigate,
  isOpen,
  onClose,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Focus on mount or when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setLoading(true);
    debounceTimeoutRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          onResultsChange?.(data);
          setSelectedResultIndex(-1);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, onResultsChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose?.();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedResultIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedResultIndex >= 0) {
      e.preventDefault();
      onNavigate?.(results[selectedResultIndex].fileId);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchBox}>
        <input
          ref={searchInputRef}
          type="text"
          className={styles.input}
          placeholder="Search files and content... (press Esc to close)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {loading && <span className={styles.spinner}>⟳</span>}
        {query && !loading && (
          <span className={styles.resultCount}>{results.length} results</span>
        )}
      </div>

      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((result, resultIndex) => (
            <div
              key={result.fileId}
              className={`${styles.resultFile} ${
                resultIndex === selectedResultIndex ? styles.selected : ""
              }`}
              onClick={() => onNavigate?.(result.fileId)}
            >
              <div className={styles.resultFileName}>{result.fileName}</div>
              <ul className={styles.resultMatches}>
                {result.matches.map((match, matchIndex) => (
                  <li key={matchIndex} className={styles.resultMatch}>
                    <span className={styles.lineNumber}>
                      Line {match.lineNumber}:
                    </span>
                    <span className={styles.lineContent}>
                      {match.lineContent}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <div className={styles.noResults}>No results found</div>
      )}
    </div>
  );
}
