import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaListOl,
  FaListUl,
  FaQuoteLeft,
  FaLink,
  FaImage,
} from "react-icons/fa";
import { cn } from "../lib/utils";

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxHeight?: string;
  minHeight?: string;
  maxWidth?: string;
  showToolbar?: boolean;
  autoFocus?: boolean;
  linkUrlHandler?: (url: string) => string;
  imageUrlHandler?: (url: string) => string;
  allowedFormats?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    alignment?: boolean;
    lists?: boolean;
    links?: boolean;
    images?: boolean;
    codeBlocks?: boolean;
    quotes?: boolean;
    colors?: boolean;
    fontSize?: boolean;
    headings?: boolean;
  };
}

const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
  disabled = false,
  maxHeight = "600px",
  minHeight = "200px",
  maxWidth = "1424px",
  showToolbar = true,
  autoFocus = false,
  linkUrlHandler,
  imageUrlHandler,
  allowedFormats = {
    bold: true,
    italic: true,
    underline: true,
    strikethrough: true,
    alignment: true,
    lists: true,
    links: true,
    images: true,
    codeBlocks: true,
    quotes: true,
    colors: true,
    fontSize: true,
    headings: true,
  },
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const linkDropdownRef = useRef<HTMLDivElement>(null);
  const imageDropdownRef = useRef<HTMLDivElement>(null);
  const [editorIsEmpty, setEditorIsEmpty] = useState(true);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl'>('ltr');

  const [formattingState, setFormattingState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    orderedList: false,
    unorderedList: false,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (linkDropdownRef.current && !linkDropdownRef.current.contains(event.target as Node)) {
        setShowLinkDropdown(false);
        setLinkUrl("");
        setLinkText("");
      }
      if (imageDropdownRef.current && !imageDropdownRef.current.contains(event.target as Node)) {
        setShowImageDropdown(false);
        setImageUrl("");
        setImageAlt("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);


  const handleChange = () => {
    if (editorRef.current) {
      const textContent = editorRef.current.textContent || "";
      const content = editorRef.current.innerHTML;
      
      const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
      if (arabicRegex.test(textContent)) {
        setTextDirection('rtl');
        editorRef.current.style.direction = 'rtl';
        editorRef.current.style.textAlign = 'right';
      } else {
        setTextDirection('ltr');
        editorRef.current.style.direction = 'ltr';
        editorRef.current.style.textAlign = 'left';
      }
      
      onChange(content);
      setEditorIsEmpty(textContent.trim() === "");
    }
  };


  const wrapSelectionWithTag = (tagName: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (editorRef.current.contains(range.commonAncestorContainer)) {
        const parentElement = range.commonAncestorContainer.parentElement;
        
        if (parentElement && parentElement.tagName.toLowerCase() === tagName.toLowerCase()) {
          const parent = parentElement.parentNode;
          if (parent) {
            while (parentElement.firstChild) {
              parent.insertBefore(parentElement.firstChild, parentElement);
            }
            parent.removeChild(parentElement);
          }
        } else {
          if (!range.collapsed) {
            const newNode = document.createElement(tagName);
            newNode.appendChild(range.extractContents());
            range.insertNode(newNode);

            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.selectNodeContents(newNode);
            selection.addRange(newRange);
          } else {
            const newNode = document.createElement(tagName);
            newNode.innerHTML = '&#8203;';
            range.insertNode(newNode);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(newNode);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }

        handleChange();
        updateFormattingState();
      }
    } else {
      editorRef.current.focus();
      const newNode = document.createElement(tagName);
      newNode.innerHTML = '&#8203;';
      editorRef.current.appendChild(newNode);
      
      const newRange = document.createRange();
      const newSelection = window.getSelection();
      newRange.selectNodeContents(newNode);
      newRange.collapse(true);
      newSelection?.removeAllRanges();
      newSelection?.addRange(newRange);
      
      handleChange();
      updateFormattingState();
    }
  };

  const toggleBold = () => wrapSelectionWithTag("strong");
  const toggleItalic = () => wrapSelectionWithTag("em");
  const toggleUnderline = () => wrapSelectionWithTag("u");
  const toggleStrikethrough = () => wrapSelectionWithTag("s");

  const applyAlignment = (alignment: string) => {
    applyFormat(
      `justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`,
    );
  };

  const toggleList = (
    listType: "insertOrderedList" | "insertUnorderedList",
  ) => {
    applyFormat(listType);
  };

  const createLink = () => {
    setShowLinkDropdown(true);
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    }
  };

  const insertLink = () => {
    if (linkUrl && linkText && editorRef.current) {
      const processedUrl = linkUrlHandler ? linkUrlHandler(linkUrl) : linkUrl;
      
      editorRef.current.focus();

      const linkHTML = `<a href="${processedUrl}" style="color: #3b82f6; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      
      try {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          if (editorRef.current.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = linkHTML;
            const linkElement = tempDiv.firstChild as HTMLElement;
            
            range.insertNode(linkElement);
            range.setStartAfter(linkElement);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            editorRef.current.insertAdjacentHTML('beforeend', linkHTML);
          }
        } else {
          editorRef.current.insertAdjacentHTML('beforeend', linkHTML);
        }
      } catch {
        editorRef.current.insertAdjacentHTML('beforeend', linkHTML);
      }
      
      setShowLinkDropdown(false);
      setLinkUrl("");
      setLinkText("");
      handleChange();
    }
  };

  const insertImage = () => {
    if (imageUrl && editorRef.current) {
      const processedUrl = imageUrlHandler ? imageUrlHandler(imageUrl) : imageUrl;
      
      editorRef.current.focus();
      
      const imgHTML = `<img src="${processedUrl}" alt="${imageAlt || 'Image'}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; display: block;" />`;
      
      try {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          
          if (editorRef.current.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = imgHTML;
            const imageElement = tempDiv.firstChild as HTMLElement;
            
            range.insertNode(imageElement);
            
            range.setStartAfter(imageElement);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            editorRef.current.insertAdjacentHTML('beforeend', imgHTML);
          }
        } else {
          editorRef.current.insertAdjacentHTML('beforeend', imgHTML);
        }
      } catch {
        editorRef.current.insertAdjacentHTML('beforeend', imgHTML);
      }
      
      setShowImageDropdown(false);
      setImageUrl("");
      setImageAlt("");
      handleChange();
    }
  };

  const insertBlockquote = () => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        const blockquoteElement = document.createElement("blockquote");
        blockquoteElement.style.borderLeft = "4px solid #3b82f6";
        blockquoteElement.style.paddingLeft = "16px";
        blockquoteElement.style.margin = "16px 0";
        blockquoteElement.style.fontStyle = "italic";
        blockquoteElement.style.color = "#6b7280";
        
        if (!range.collapsed) {
          // There's selected text
          blockquoteElement.appendChild(range.extractContents());
        } else {
          blockquoteElement.innerHTML = "Quote text here...";
        }

        range.deleteContents();
        range.insertNode(blockquoteElement);

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(blockquoteElement);
        selection.addRange(newRange);

        handleChange();
      }
    } else {
      editorRef.current.focus();
      const blockquoteElement = document.createElement("blockquote");
      blockquoteElement.style.borderLeft = "4px solid #3b82f6";
      blockquoteElement.style.paddingLeft = "16px";
      blockquoteElement.style.margin = "16px 0";
      blockquoteElement.style.fontStyle = "italic";
      blockquoteElement.style.color = "#6b7280";
      blockquoteElement.innerHTML = "Quote text here...";
      
      editorRef.current.appendChild(blockquoteElement);
      
      const newRange = document.createRange();
      const newSelection = window.getSelection();
      newRange.selectNodeContents(blockquoteElement);
      newSelection?.removeAllRanges();
      newSelection?.addRange(newRange);
      
      handleChange();
    }
  };

  const changeFontSize = (size: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    if (editorRef.current.innerHTML.trim() === '') {
      editorRef.current.innerHTML = '<span>Text</span>';
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editorRef.current.firstChild!);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    applyFormat("fontSize", size);
  };

  const changeFontColor = (color: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    if (editorRef.current.innerHTML.trim() === '') {
      editorRef.current.innerHTML = '<span>Text</span>';
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editorRef.current.firstChild!);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    applyFormat("foreColor", color);
  };

  const changeBackgroundColor = (color: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    if (editorRef.current.innerHTML.trim() === '') {
      editorRef.current.innerHTML = '<span>Text</span>';
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editorRef.current.firstChild!);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    applyFormat("hiliteColor", color);
  };

  const insertCodeBlock = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (
        editorRef.current &&
        editorRef.current.contains(range.commonAncestorContainer)
      ) {
        const codeElement = document.createElement("code");
        codeElement.appendChild(range.extractContents());

        const preElement = document.createElement("pre");
        preElement.style.backgroundColor = "#f3f4f6";
        preElement.style.padding = "12px";
        preElement.style.borderRadius = "6px";
        preElement.style.overflow = "auto";
        preElement.appendChild(codeElement);

        range.deleteContents();
        range.insertNode(preElement);

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(preElement);
        selection.addRange(newRange);

        handleChange();
        updateFormattingState();
      }
    } else {
      const preElement = document.createElement("pre");
      preElement.style.backgroundColor = "#f3f4f6";
      preElement.style.padding = "12px";
      preElement.style.borderRadius = "6px";
      preElement.style.overflow = "auto";
      
      const codeElement = document.createElement("code");
      codeElement.innerHTML = "<br>";
      preElement.appendChild(codeElement);

      if (editorRef.current) {
        const range = document.createRange();
        const sel = window.getSelection();

        if (sel && sel.rangeCount > 0) {
          range.setStart(sel.anchorNode!, sel.anchorOffset);
        } else {
          range.setStart(
            editorRef.current,
            editorRef.current.childNodes.length,
          );
        }
        range.collapse(true);
        range.insertNode(preElement);
        range.setStart(codeElement, 0);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);

        handleChange();
        updateFormattingState();
      }
    }
  };


  const undo = useCallback(() => applyFormat("undo"), []);
  const redo = useCallback(() => applyFormat("redo"), []);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, pastedText);
  };


  const applyFormat = (command: string, value: any = null) => {
    if (disabled) return;
    
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    if (command.startsWith('justify') && editorRef.current.innerHTML.trim() === '') {
      editorRef.current.innerHTML = '<div><br></div>';
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editorRef.current.firstChild!);
      range.collapse(true);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    if ((command === 'insertOrderedList' || command === 'insertUnorderedList') && editorRef.current.innerHTML.trim() === '') {
      editorRef.current.innerHTML = '<div>List item</div>';
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editorRef.current.firstChild!);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    
    document.execCommand(command, false, value);
    handleChange();
    updateFormattingState();
  };

  const updateFormattingState = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const anchorNode = selection.anchorNode;

        let isBold = false;
        let isItalic = false;
        let isUnderline = false;
        let isStrikeThrough = false;
        let isAlignLeft = false;
        let isAlignCenter = false;
        let isAlignRight = false;
        let isOrderedList = false;
        let isUnorderedList = false;

        if (anchorNode) {
          let currentNode: Node | null = anchorNode;
          while (currentNode && currentNode !== editorRef.current) {
            if (currentNode.nodeType === Node.ELEMENT_NODE) {
              const element = currentNode as HTMLElement;
              const tagName = element.tagName.toLowerCase();

              if (tagName === "strong" || tagName === "b") {
                isBold = true;
              }
              if (tagName === "em" || tagName === "i") {
                isItalic = true;
              }
              if (tagName === "u") {
                isUnderline = true;
              }
              if (tagName === "s" || tagName === "strike") {
                isStrikeThrough = true;
              }
              if (element.style.textAlign === "left") {
                isAlignLeft = true;
              }
              if (element.style.textAlign === "center") {
                isAlignCenter = true;
              }
              if (element.style.textAlign === "right") {
                isAlignRight = true;
              }
              if (tagName === "ol") {
                isOrderedList = true;
              }
              if (tagName === "ul") {
                isUnorderedList = true;
              }
            }
            currentNode = currentNode.parentNode;
          }
        }

        setFormattingState({
          bold: isBold,
          italic: isItalic,
          underline: isUnderline,
          strikeThrough: isStrikeThrough,
          alignLeft: isAlignLeft,
          alignCenter: isAlignCenter,
          alignRight: isAlignRight,
          orderedList: isOrderedList,
          unorderedList: isUnorderedList,
        });
      }
    }
  };

  const getButtonClassName = (isActive: boolean) => {
    return cn(
      "rounded px-2 py-1.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
      isActive 
        ? "bg-blue-500 text-white shadow-md" 
        : "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:scale-105",
      disabled && "opacity-50 cursor-not-allowed"
    );
  };

  const getTooltipClassName = () => {
    return "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10";
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        editorRef.current &&
        document.activeElement === editorRef.current
      ) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            toggleBold();
            break;
          case "i":
            e.preventDefault();
            toggleItalic();
            break;
          case "u":
            e.preventDefault();
            toggleUnderline();
            break;
          case "z":
            e.preventDefault();
            undo();
            break;
          case "y":
            e.preventDefault();
            redo();
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [toggleBold, toggleItalic, toggleUnderline, undo, redo]);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      const textContent = editorRef.current.textContent || "";
      setEditorIsEmpty(textContent.trim() === "");
    }
  }, [value]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (
        editorRef.current &&
        editorRef.current.contains(window.getSelection()?.anchorNode ?? null)
      ) {
        updateFormattingState();
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);


  return (
    <div className={cn("stockfish-components", className)}>
      <div className="mx-auto p-4" style={{ maxWidth }}>
        {showToolbar && (
          <div className="flex flex-wrap items-center gap-2 rounded-t-md border border-gray-300 bg-gray-50 p-2">

            <div className="relative group">
              <button
                type="button"
                onClick={undo}
                disabled={disabled}
                className={getButtonClassName(false)}
                aria-label="Undo"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                <div className={getTooltipClassName()}>Undo (Ctrl+Z)</div>
              </button>
            </div>
            
            <div className="relative group">
              <button
                type="button"
                onClick={redo}
                disabled={disabled}
                className={getButtonClassName(false)}
                aria-label="Redo"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <div className={getTooltipClassName()}>Redo (Ctrl+Y)</div>
              </button>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-1"/>

            {allowedFormats.headings && (
              <select
                onChange={e => {
                  if (!editorRef.current) return;
                  
                  editorRef.current.focus();
                  
                  if (editorRef.current.innerHTML.trim() === '') {
                    editorRef.current.innerHTML = '<div>Heading text</div>';
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(editorRef.current.firstChild!);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                  }
                  
                  applyFormat("formatBlock", e.target.value);
                }}
                disabled={disabled}
                className={cn(
                  "rounded px-2 py-1 text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Text format"
              >
                <option value="<p>">Paragraph</option>
                <option value="<h1>">Heading 1</option>
                <option value="<h2>">Heading 2</option>
                <option value="<h3>">Heading 3</option>
              </select>
            )}
            
            {allowedFormats.fontSize && (
              <select
                onChange={e => {
                  if (!editorRef.current) return;
                  
                  editorRef.current.focus();
                  
                  if (editorRef.current.innerHTML.trim() === '') {
                    editorRef.current.innerHTML = '<span>Text</span>';
                    const range = document.createRange();
                    const selection = window.getSelection();
                    range.selectNodeContents(editorRef.current.firstChild!);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                  }
                  
                  changeFontSize(e.target.value);
                }}
                disabled={disabled}
                className={cn(
                  "rounded px-2 py-1 text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                aria-label="Font size"
                defaultValue="3"
              >
                <option value="1">Small</option>
                <option value="3">Normal</option>
                <option value="5">Large</option>
                <option value="7">Huge</option>
              </select>
            )}
            
            {(allowedFormats.headings || allowedFormats.fontSize) && (
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
            )}

            {allowedFormats.bold && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={toggleBold}
                  disabled={disabled}
                  className={getButtonClassName(formattingState.bold)}
                  aria-label="Bold"
                >
                  <FaBold size={14} />
                  <div className={getTooltipClassName()}>Bold (Ctrl+B)</div>
                </button>
              </div>
            )}
            
            {allowedFormats.italic && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={toggleItalic}
                  disabled={disabled}
                  className={getButtonClassName(formattingState.italic)}
                  aria-label="Italic"
                >
                  <FaItalic size={14} />
                  <div className={getTooltipClassName()}>Italic (Ctrl+I)</div>
                </button>
              </div>
            )}
            
            {allowedFormats.underline && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={toggleUnderline}
                  disabled={disabled}
                  className={getButtonClassName(formattingState.underline)}
                  aria-label="Underline"
                >
                  <FaUnderline size={14} />
                  <div className={getTooltipClassName()}>Underline (Ctrl+U)</div>
                </button>
              </div>
            )}
            
            {allowedFormats.strikethrough && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={toggleStrikethrough}
                  disabled={disabled}
                  className={getButtonClassName(formattingState.strikeThrough)}
                  aria-label="Strikethrough"
                >
                  <FaStrikethrough size={14} />
                  <div className={getTooltipClassName()}>Strikethrough</div>
                </button>
              </div>
            )}

            {allowedFormats.alignment && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => applyAlignment("left")}
                    disabled={disabled}
                    className={getButtonClassName(formattingState.alignLeft)}
                    aria-label="Align left"
                  >
                    <FaAlignLeft size={14} />
                    <div className={getTooltipClassName()}>Align Left</div>
                  </button>
                </div>
                
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => applyAlignment("center")}
                    disabled={disabled}
                    className={getButtonClassName(formattingState.alignCenter)}
                    aria-label="Align center"
                  >
                    <FaAlignCenter size={14} />
                    <div className={getTooltipClassName()}>Align Center</div>
                  </button>
                </div>
                
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => applyAlignment("right")}
                    disabled={disabled}
                    className={getButtonClassName(formattingState.alignRight)}
                    aria-label="Align right"
                  >
                    <FaAlignRight size={14} />
                    <div className={getTooltipClassName()}>Align Right</div>
                  </button>
                </div>
              </>
            )}

            {allowedFormats.lists && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => toggleList("insertOrderedList")}
                    disabled={disabled}
                    className={getButtonClassName(formattingState.orderedList)}
                    aria-label="Ordered list"
                  >
                    <FaListOl size={14} />
                    <div className={getTooltipClassName()}>Numbered List</div>
                  </button>
                </div>
                
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => toggleList("insertUnorderedList")}
                    disabled={disabled}
                    className={getButtonClassName(formattingState.unorderedList)}
                    aria-label="Unordered list"
                  >
                    <FaListUl size={14} />
                    <div className={getTooltipClassName()}>Bullet List</div>
                  </button>
                </div>
              </>
            )}

            {(allowedFormats.links || allowedFormats.images) && (
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
            )}

            {allowedFormats.links && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={createLink}
                  disabled={disabled}
                  className={getButtonClassName(false)}
                  aria-label="Insert link"
                >
                  <FaLink size={14} />
                  <div className={getTooltipClassName()}>Insert Link</div>
                </button>
                
                {showLinkDropdown && (
                  <div 
                    ref={linkDropdownRef}
                    className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-20 w-80"
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
                        <input
                          type="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="Enter link text"
                          className={cn(
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          )}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              insertLink();
                            } else if (e.key === 'Escape') {
                              setShowLinkDropdown(false);
                              setLinkUrl("");
                              setLinkText("");
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                        <input
                          type="url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                          className={cn(
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          )}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              insertLink();
                            } else if (e.key === 'Escape') {
                              setShowLinkDropdown(false);
                              setLinkUrl("");
                              setLinkText("");
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowLinkDropdown(false);
                            setLinkUrl("");
                            setLinkText("");
                          }}
                          className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={insertLink}
                          disabled={!linkUrl || !linkText}
                          className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {allowedFormats.images && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setShowImageDropdown(true)}
                  disabled={disabled}
                  className={getButtonClassName(false)}
                  aria-label="Insert image"
                >
                  <FaImage size={14} />
                  <div className={getTooltipClassName()}>Insert Image</div>
                </button>
                
                {showImageDropdown && (
                  <div 
                    ref={imageDropdownRef}
                    className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-20 w-80"
                  >
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className={cn(
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          )}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              insertImage();
                            } else if (e.key === 'Escape') {
                              setShowImageDropdown(false);
                              setImageUrl("");
                              setImageAlt("");
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (Optional)</label>
                        <input
                          type="text"
                          value={imageAlt}
                          onChange={(e) => setImageAlt(e.target.value)}
                          placeholder="Describe the image"
                          className={cn(
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          )}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              insertImage();
                            } else if (e.key === 'Escape') {
                              setShowImageDropdown(false);
                              setImageUrl("");
                              setImageAlt("");
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowImageDropdown(false);
                            setImageUrl("");
                            setImageAlt("");
                          }}
                          className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={insertImage}
                          disabled={!imageUrl}
                          className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(allowedFormats.codeBlocks || allowedFormats.quotes) && (
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
            )}

            {allowedFormats.codeBlocks && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={insertCodeBlock}
                  disabled={disabled}
                  className={getButtonClassName(false)}
                  aria-label="Insert code block"
                >
                  <svg
                    className="h-4 w-4"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" />
                    <polyline points="7 8 3 12 7 16" />
                    <polyline points="17 8 21 12 17 16" />
                    <line x1="14" y1="4" x2="10" y2="20" />
                  </svg>
                  <div className={getTooltipClassName()}>Code Block</div>
                </button>
              </div>
            )}
            
            {allowedFormats.quotes && (
              <div className="relative group">
                <button
                  type="button"
                  onClick={insertBlockquote}
                  disabled={disabled}
                  className={getButtonClassName(false)}
                  aria-label="Insert quote"
                >
                  <FaQuoteLeft size={14} />
                  <div className={getTooltipClassName()}>Quote</div>
                </button>
              </div>
            )}
            
            {allowedFormats.colors && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <div className="relative group">
                  <input
                    type="color"
                    onChange={e => {
                      if (!editorRef.current) return;
                      
                      editorRef.current.focus();
                      
                      if (editorRef.current.innerHTML.trim() === '') {
                        editorRef.current.innerHTML = '<span>Text</span>';
                        const range = document.createRange();
                        const selection = window.getSelection();
                        range.selectNodeContents(editorRef.current.firstChild!);
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                      }
                      
                      changeFontColor(e.target.value);
                    }}
                    disabled={disabled}
                    aria-label="Font color"
                    className={cn(
                      "w-8 h-8 rounded cursor-pointer border border-gray-300",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    title="Text Color"
                  />
                  <div className={getTooltipClassName()}>Text Color</div>
                </div>
                
                <div className="relative group">
                  <input
                    type="color"
                    onChange={e => {
                      if (!editorRef.current) return;
                      
                      editorRef.current.focus();
                      
                      if (editorRef.current.innerHTML.trim() === '') {
                        editorRef.current.innerHTML = '<span>Text</span>';
                        const range = document.createRange();
                        const selection = window.getSelection();
                        range.selectNodeContents(editorRef.current.firstChild!);
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                      }
                      
                      changeBackgroundColor(e.target.value);
                    }}
                    disabled={disabled}
                    aria-label="Background color"
                    className={cn(
                      "w-8 h-8 rounded cursor-pointer border border-gray-300",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    title="Background Color"
                  />
                  <div className={getTooltipClassName()}>Background Color</div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="relative">
          <div
            ref={editorRef}
            contentEditable={!disabled}
            className={cn(
              "editor-content break-words cursor-text border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
              showToolbar ? 'rounded-b-md border-t-0' : 'rounded-md',
              textDirection === 'rtl' ? 'text-right' : 'text-left',
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            )}
            style={{ 
              whiteSpace: "pre-wrap",
              direction: textDirection,
              lineHeight: "1.6",
              minHeight,
              maxHeight,
              overflowY: "auto"
            }}
            onInput={handleChange}
            onFocus={() => setEditorIsEmpty(false)}
            onBlur={() => {
              const textContent = editorRef.current?.textContent || "";
              setEditorIsEmpty(textContent.trim() === "");
            }}
            onPaste={handlePaste}
            suppressContentEditableWarning={true}
          />
          {editorIsEmpty && (
            <div className={cn(
              "pointer-events-none absolute left-0 top-0 p-4 text-gray-400",
              textDirection === 'rtl' ? 'text-right' : 'text-left'
            )}>
              {placeholder}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TextEditor;