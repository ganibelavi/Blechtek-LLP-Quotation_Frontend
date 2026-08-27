import React, { useState, useRef, useEffect } from "react";
import "./SearchDropdown.css";

export default function SearchDropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  onAddNew,
  addNewLabel = "Add new",
  name,
  required = false,
  allowFreeText = true,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchText.toLowerCase()),
  );

  const isExactMatch = options.some(
    (opt) => opt.toLowerCase() === searchText.toLowerCase(),
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchText(value || "");
  }, [value]);

  const acceptInputValue = () => {
    const trimmed = searchText.trim();
    if (trimmed) {
      onChange(trimmed);
      setSearchText(trimmed);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchText(newValue);
    onChange(newValue);
    setIsOpen(!isAddingNew);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (!isAddingNew) {
      setIsOpen(true);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen && !isAddingNew) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          const selected = filteredOptions[highlightedIndex];
          onChange(selected);
          setSearchText(selected);
          setIsOpen(false);
          setHighlightedIndex(-1);
        } else if (allowFreeText && searchText.trim()) {
          acceptInputValue();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setIsAddingNew(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleOptionClick = (option) => {
    onChange(option);
    setSearchText(option);
    setIsOpen(false);
    setIsAddingNew(false);
    setHighlightedIndex(-1);
  };

  const handleAddNewClick = (e) => {
    e.stopPropagation();
    onAddNew?.();
    setIsAddingNew(true);
    setSearchText("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (allowFreeText && searchText.trim() && !isExactMatch) {
        acceptInputValue();
      } else {
        setIsOpen(false);
        setIsAddingNew(false);
        setHighlightedIndex(-1);
      }
    }, 200);
  };

  return (
    <div className="search-dropdown" ref={dropdownRef}>
      <label htmlFor={name} className="search-dropdown__label">
        {label}{" "}
        {required && <span className="search-dropdown__required">*</span>}
      </label>
      <div className="search-dropdown__input-wrapper">
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="text"
          value={searchText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`search-dropdown__input ${error ? "search-dropdown__input--error" : ""} ${isOpen ? "search-dropdown__input--open" : ""}`}
          autoComplete="off"
        />
        {onAddNew && !disabled && (
          <button
            type="button"
            className="search-dropdown__add-btn"
            onClick={handleAddNewClick}
            aria-label={addNewLabel}
            title={addNewLabel}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>
      {error && <span className="search-dropdown__error">{error}</span>}
      {isOpen && !isAddingNew && filteredOptions.length > 0 && (
        <ul className="search-dropdown__options" role="listbox">
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              role="option"
              aria-selected={index === highlightedIndex}
              className={`search-dropdown__option ${index === highlightedIndex ? "search-dropdown__option--highlighted" : ""}`}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
      {isOpen && !isAddingNew && filteredOptions.length === 0 && searchText && allowFreeText && (
        <div className="search-dropdown__no-results">
          Press Enter to add "{searchText}" as new entry
        </div>
      )}
    </div>
  );
}