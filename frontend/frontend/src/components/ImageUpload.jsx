import { useRef, useState } from 'react'
import ScanningHUD from './ScanningHUD'

const SEARCH_CATEGORIES = [
  { id: 'social', label: 'Social Media', defaultChecked: true },
  { id: 'mugshots', label: 'Mugshots', defaultChecked: true },
  { id: 'scammers', label: 'Scammers', defaultChecked: true },
  { id: 'videos', label: 'Videos', defaultChecked: true },
  { id: 'news', label: 'News & Blogs', defaultChecked: true },
]

export default function ImageUpload({ onVerify, loading }) {
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState(
    SEARCH_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.defaultChecked }), {})
  )

  const inputRef = useRef(null)

  const handleFileSelect = (file) => {
    if (file?.type?.startsWith('image/')) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleVerify = () => {
    if (!selectedFile) {
      alert('Please select or drop a photo of the person you want to find first.')
      return
    }

    onVerify(selectedFile)
  }

  const handleClear = () => {
    setSelectedFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const toggleCategory = (id) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  return (
    <section className="card upload-card">
      <div className="card-heading">
        <div className="card-heading-title-group">
          <span className="step-badge">STEP 01</span>
          <h2>Upload Face Photo</h2>
        </div>
        <span className="step-hint">FACIAL RECOGNITION</span>
      </div>

      {/* If loading, show the biometric scanning HUD */}
      {loading ? (
        <ScanningHUD active={loading} previewImage={preview} />
      ) : (
        <>
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFileSelect(e.dataTransfer.files[0])
            }}
            onClick={() => !preview && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              aria-label="Upload photo to search"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            {preview ? (
              <div className="preview-wrapper">
                <img
                  className="preview"
                  src={preview}
                  alt="Selected target face preview"
                />
                <div className="preview-overlay-tag">
                  <span>Photo Ready for AI Scan</span>
                </div>
              </div>
            ) : (
              <div className="drop-zone-placeholder">
                <div className="drop-zone-icon-box">
                  {/* Face outline with search icon */}
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="6" width="32" height="32" rx="10" stroke="#3B82F6" strokeWidth="2.2" strokeDasharray="4 4" />
                    <circle cx="22" cy="18" r="6" stroke="#1D4ED8" strokeWidth="2.4" />
                    <path d="M12 34C12 28.4772 16.4772 24 22 24C27.5228 24 32 28.4772 32 34" stroke="#1D4ED8" strokeWidth="2.4" strokeLinecap="round" />
                    <circle cx="28" cy="28" r="4" fill="#FF3B5C" />
                  </svg>
                </div>
                <h3 className="drop-title">Drop photo(s) of the person you want to find</h3>
                <p className="drop-sub">
                  Drag &amp; drop here, or{' '}
                  <button
                    type="button"
                    className="browse-link-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      inputRef.current?.click()
                    }}
                  >
                    Browse…
                  </button>
                </p>
                <div className="supported-formats">PNG, JPG, WEBP, HEIC · AI Landmark extraction</div>
              </div>
            )}
          </div>

          {/* Search Category Toggles (FaceCheck.ID inspiration) */}
          <div className="categories-container">
            <span className="categories-title">TARGET REPOSITORIES:</span>
            <div className="categories-grid">
              {SEARCH_CATEGORIES.map((cat) => (
                <label key={cat.id} className="category-checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!selectedCategories[cat.id]}
                    onChange={() => toggleCategory(cat.id)}
                    className="category-checkbox"
                  />
                  <span className="category-checkmark" />
                  <span className="category-text">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="upload-actions">
            {preview && (
              <button
                className="button button-outline"
                type="button"
                onClick={handleClear}
              >
                Change Photo
              </button>
            )}

            <button
              className="button button-search-face"
              type="button"
              onClick={handleVerify}
              disabled={loading}
            >
              <span className="search-btn-icon">🔍</span>
              <span>Search Internet by Face</span>
            </button>
          </div>
        </>
      )}
    </section>
  )
}