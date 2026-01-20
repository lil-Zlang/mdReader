import styles from "./Breadcrumb.module.css";

interface BreadcrumbProps {
  path: string;
  onNavigate?: (segment: string) => void;
}

export default function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  const segments = path.split("/").filter((s) => s);

  const handleClick = (index: number) => {
    if (onNavigate) {
      const navigateTo = segments.slice(0, index + 1).join("/");
      onNavigate(navigateTo);
    }
  };

  return (
    <div className={styles.breadcrumb}>
      <span className={styles.segment} onClick={() => handleClick(-1)}>
        📂 Home
      </span>
      {segments.map((segment, index) => (
        <div key={index} className={styles.separator}>
          <span className={styles.chevron}>/</span>
          <span
            className={styles.segment}
            onClick={() => handleClick(index)}
          >
            {segment}
          </span>
        </div>
      ))}
    </div>
  );
}
