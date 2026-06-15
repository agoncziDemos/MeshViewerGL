import { useEffect, useRef, useState } from "react";

export type SampleStlOption = {
  label: string;
  path: string;
};

type SampleStlMenuProps = {
  samples: SampleStlOption[];
  disabled: boolean;
  onSampleSelected: (sample: SampleStlOption) => void;
};

export function SampleStlMenu({
  samples,
  disabled,
  onSampleSelected,
}: SampleStlMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  function handleButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (disabled) {
      return;
    }

    setIsOpen((value) => !value);
  }

  function handleSampleClick(sample: SampleStlOption) {
    setIsOpen(false);
    onSampleSelected(sample);
  }

  return (
    <div ref={menuRef} className="sample-menu">
      <button type="button" disabled={disabled} onClick={handleButtonClick}>
        Load Sample STL
      </button>

      {isOpen && (
        <div className="sample-menu-panel">
          {samples.map((sample) => (
            <button
              key={sample.path}
              type="button"
              onClick={() => handleSampleClick(sample)}
            >
              {sample.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
