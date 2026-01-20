import { useEffect, useState } from "react";
import styles from "./BacklinksPanel.module.css";

interface BacklinkItem {
  fileId: string;
  fileName: string;
  context: string;
}

interface BacklinksPanelProps {
  fileId: string;
  onNavigate?: (fileId: string) => void;
}

export default function BacklinksPanel({
  fileId,
  onNavigate,
}: BacklinksPanelProps) {
  const [linkedFrom, setLinkedFrom] = useState<BacklinkItem[]>([]);
  const [linksTo, setLinksTo] = useState<BacklinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBacklinks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/backlinks/${fileId}`);
        if (!response.ok) {
          throw new Error("Failed to load backlinks");
        }
        const data = await response.json();
        setLinkedFrom(data.linkedFrom || []);
        setLinksTo(data.linksTo || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error loading backlinks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBacklinks();
  }, [fileId]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading links...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  const hasLinks = linkedFrom.length > 0 || linksTo.length > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>Links</div>

      {!hasLinks && <div className={styles.empty}>No links found</div>}

      {linksTo.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            Links To ({linksTo.length})
          </div>
          <ul className={styles.linkList}>
            {linksTo.map((link) => (
              <li
                key={`${link.fileId}-to`}
                className={styles.linkItem}
                onClick={() => onNavigate?.(link.fileId)}
              >
                <div className={styles.linkName}>{link.fileName}</div>
                <div className={styles.linkContext}>{link.context}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {linkedFrom.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            Linked From ({linkedFrom.length})
          </div>
          <ul className={styles.linkList}>
            {linkedFrom.map((link) => (
              <li
                key={`${link.fileId}-from`}
                className={styles.linkItem}
                onClick={() => onNavigate?.(link.fileId)}
              >
                <div className={styles.linkName}>{link.fileName}</div>
                <div className={styles.linkContext}>{link.context}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
