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

const TextEditor = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorIsEmpty, setEditorIsEmpty] = useState(true);
  const [showLinkDropdown, setShowLinkDropdown] = useState(false);
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl'>('ltr');

  // State to keep track of formatting
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


  const handleChange = () => {
    if (editorRef.current) {
      const textContent = editorRef.current.textContent || "";
      const content = editorRef.current.innerHTML;
      
      // Detect Arabic text and set direction
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


  // Function to wrap selected text with a tag
  const wrapSelectionWithTag = (tagName: string) => {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (
        editorRef.current &&
        editorRef.current.contains(range.commonAncestorContainer)
      ) {
        // Create the new element with the specified tag
        const newNode = document.createElement(tagName);
        newNode.appendChild(range.extractContents());

        range.deleteContents();
        range.insertNode(newNode);

        // Update the selection to the new node
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(newNode);
        selection.addRange(newRange);

        handleChange();
        updateFormattingState();
      }
    }
  };

  const toggleBold = () => wrapSelectionWithTag("strong");

  // Other formatting functions remain the same
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
    if (linkUrl && linkText) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Create link element
        const linkElement = document.createElement("a");
        linkElement.href = linkUrl;
        linkElement.textContent = linkText;
        linkElement.style.color = "#3b82f6";
        linkElement.style.textDecoration = "underline";
        linkElement.target = "_blank";
        linkElement.rel = "noopener noreferrer";
        
        range.deleteContents();
        range.insertNode(linkElement);
        
        // Clear selection
        selection.removeAllRanges();
      } else {
        // No selection, insert at cursor position
        document.execCommand('insertHTML', false, 
          `<a href="${linkUrl}" style="color: #3b82f6; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${linkText}</a>`
        );
      }
      
      setShowLinkDropdown(false);
      setLinkUrl("");
      setLinkText("");
      handleChange();
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      const imgElement = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" />`;
      document.execCommand('insertHTML', false, imgElement);
      
      setShowImageDropdown(false);
      setImageUrl("");
      setImageAlt("");
      handleChange();
    }
  };

  const insertBlockquote = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (
        editorRef.current &&
        editorRef.current.contains(range.commonAncestorContainer)
      ) {
        const blockquoteElement = document.createElement("blockquote");
        blockquoteElement.style.borderLeft = "4px solid #3b82f6";
        blockquoteElement.style.paddingLeft = "16px";
        blockquoteElement.style.margin = "16px 0";
        blockquoteElement.style.fontStyle = "italic";
        blockquoteElement.style.color = "#6b7280";
        blockquoteElement.appendChild(range.extractContents());

        range.deleteContents();
        range.insertNode(blockquoteElement);

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(blockquoteElement);
        selection.addRange(newRange);

        handleChange();
      }
    }
  };

  const changeFontSize = (size: string) => {
    applyFormat("fontSize", size);
  };

  const changeFontColor = (color: string) => {
    applyFormat("foreColor", color);
  };

  const changeBackgroundColor = (color: string) => {
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
        // Wrap selected text in <pre><code></code></pre>
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

        // Update the selection to the new node
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(preElement);
        selection.addRange(newRange);

        handleChange();
        updateFormattingState();
      }
    } else {
      // If no selection, insert an empty code block
      const preElement = document.createElement("pre");
      preElement.style.backgroundColor = "#f3f4f6";
      preElement.style.padding = "12px";
      preElement.style.borderRadius = "6px";
      preElement.style.overflow = "auto";
      
      const codeElement = document.createElement("code");
      codeElement.innerHTML = "<br>"; // Ensure the code block is selectable
      preElement.appendChild(codeElement);

      if (editorRef.current) {
        const range = document.createRange();
        const sel = window.getSelection();

        // Insert the code block at the current cursor position
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

        // Move cursor inside the code element
        range.setStart(codeElement, 0);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);

        handleChange();
        updateFormattingState();
      }
    }
  };


  // Undo and Redo functions
  const undo = useCallback(() => applyFormat("undo"), []);
  const redo = useCallback(() => applyFormat("redo"), []);

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, pastedText);
  };


  const applyFormat = (command: string, value: any = null) => {
    document.execCommand(command, false, value);
    handleChange();
    updateFormattingState();
  };

  // Function to update formatting state
  const updateFormattingState = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const anchorNode = selection.anchorNode;

        // Initialize formatting states
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
    return `rounded px-2 py-1.5 text-sm transition-all duration-200 ${isActive ? "bg-blue-500 text-white shadow-md" : "bg-gray-100 hover:bg-gray-200 text-gray-700"} hover:scale-105`;
  };

  const getTooltipClassName = () => {
    return "absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10";
  };

  // Keyboard shortcuts
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
          // Add more shortcuts as needed
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
    <div className="stockfish-components">
    <div className="mx-auto p-4 max-w-[1424px] max-h-[500px]">
      <div className="flex flex-wrap items-center gap-2 rounded-t-md border border-gray-300 p-2">
        {/* Undo and Redo buttons */}
        <div className="relative group">
          <button
            type="button"
            onClick={undo}
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

    
    <div className="w-px h-6 bg-gray-300 mx-1"></div>
    {/* Formatting buttons */}
        <select
          onChange={e => {
            applyFormat("formatBlock", e.target.value);
          }}
          className="rounded px-2 py-1 text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Text format"
        >
          <option value="<p>">Paragraph</option>
          <option value="<h1>">Heading 1</option>
          <option value="<h2>">Heading 2</option>
          <option value="<h3>">Heading 3</option>
        </select>
        
        <select
          onChange={e => changeFontSize(e.target.value)}
          className="rounded px-2 py-1 text-sm border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Font size"
          defaultValue="3"
        >
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        {/* Formatting buttons */}
        <div className="relative group">
          <button
            type="button"
            onClick={toggleBold}
            className={getButtonClassName(formattingState.bold)}
            aria-label="Bold"
          >
            <FaBold size={14} />
            <div className={getTooltipClassName()}>Bold (Ctrl+B)</div>
          </button>
        </div>
        
        <div className="relative group">
          <button
            type="button"
            onClick={toggleItalic}
            className={getButtonClassName(formattingState.italic)}
            aria-label="Italic"
          >
            <FaItalic size={14} />
            <div className={getTooltipClassName()}>Italic (Ctrl+I)</div>
          </button>
        </div>
        
        <div className="relative group">
          <button
            type="button"
            onClick={toggleUnderline}
            className={getButtonClassName(formattingState.underline)}
            aria-label="Underline"
          >
            <FaUnderline size={14} />
            <div className={getTooltipClassName()}>Underline (Ctrl+U)</div>
          </button>
        </div>
        
        <div className="relative group">
          <button
            type="button"
            onClick={toggleStrikethrough}
            className={getButtonClassName(formattingState.strikeThrough)}
            aria-label="Strikethrough"
          >
            <FaStrikethrough size={14} />
            <div className={getTooltipClassName()}>Strikethrough</div>
          </button>
        </div>
        {/* Alignment buttons */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => applyAlignment("left")}
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
            className={getButtonClassName(formattingState.alignRight)}
            aria-label="Align right"
          >
            <FaAlignRight size={14} />
            <div className={getTooltipClassName()}>Align Right</div>
          </button>
        </div>
        {/* List buttons */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => toggleList("insertOrderedList")}
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
            className={getButtonClassName(formattingState.unorderedList)}
            aria-label="Unordered list"
          >
            <FaListUl size={14} />
            <div className={getTooltipClassName()}>Bullet List</div>
          </button>
        </div>
        {/* Link and Image buttons */}
        <div className="relative group">
          <button
            type="button"
            onClick={createLink}
            className={getButtonClassName(false)}
            aria-label="Insert link"
          >
            <FaLink size={14} />
            <div className={getTooltipClassName()}>Insert Link</div>
          </button>
          
          {showLinkDropdown && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-20 w-80">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Enter link text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 "
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowLinkDropdown(false)}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={insertLink}
                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Insert
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative group">
          <button
            type="button"
            onClick={() => setShowImageDropdown(true)}
            className={getButtonClassName(false)}
            aria-label="Insert image"
          >
            <FaImage size={14} />
            <div className={getTooltipClassName()}>Insert Image</div>
          </button>
          
          {showImageDropdown && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-20 w-80">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    placeholder="Describe the image"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 "
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowImageDropdown(false)}
                    className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={insertImage}
                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Insert
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Code Block, Quote, and Color buttons */}
        <div className="relative group">
          <button
            type="button"
            onClick={insertCodeBlock}
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
        
        <div className="relative group">
          <button
            type="button"
            onClick={insertBlockquote}
            className={getButtonClassName(false)}
            aria-label="Insert quote"
          >
            <FaQuoteLeft size={14} />
            <div className={getTooltipClassName()}>Quote</div>
          </button>
        </div>
        
        {/* Font Color */}
        <div className="relative group">
          <input
            type="color"
            onChange={e => changeFontColor(e.target.value)}
            aria-label="Font color"
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
            title="Text Color"
          />
          <div className={getTooltipClassName()}>Text Color</div>
        </div>
        
        {/* Background Color */}
        <div className="relative group">
          <input
            type="color"
            onChange={e => changeBackgroundColor(e.target.value)}
            aria-label="Background color"
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
            title="Background Color"
          />
          <div className={getTooltipClassName()}>Background Color</div>
        </div>
      </div>
      <div className="relative text-wrap">
        <div
          ref={editorRef}
          contentEditable={true}
          className={`editor-content min-h-[200px] max-h-[600px] overflow-y-auto break-words cursor-text rounded-b-md border border-gray-300 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            textDirection === 'rtl' ? 'text-right' : 'text-left'
          }`}
          style={{ 
            whiteSpace: "pre-wrap",
            direction: textDirection,
            lineHeight: "1.6"
          }}
          onInput={handleChange}
          onFocus={() => setEditorIsEmpty(false)}
          onBlur={() => {
            const textContent = editorRef.current?.textContent || "";
            setEditorIsEmpty(textContent.trim() === "");
          }}
          onPaste={handlePaste}
          suppressContentEditableWarning={true}
        ></div>
        {editorIsEmpty && (
          <div className={`pointer-events-none absolute left-0 top-0 p-4 text-gray-400 ${
            textDirection === 'rtl' ? 'text-right' : 'text-left'
          }`}>
            {placeholder || "Start typing..."}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default TextEditor;