import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import { ReactComponent as ArrowLeft } from "./assets/ArrowLeft.svg";
import { ReactComponent as ArrowRight } from "./assets/ArrowRight.svg";
import visDefault from "./assets/vis.svg";
import visHover from "./assets/vis-hover.svg";

const defaultLocations = [
  "Amsterdam", "Tokyo", "New York", "Berlin", "Paris",
  "Svalbard", "Barcelona", "Cape Town", "Lisbon",
  "Reykjavík", "Seoul", "Sydney", "Cairo", "Mexico City", "Oslo"
];

function App() {
  const [customTheme, setCustomTheme] = useState("vibe");
  const [customLocation, setCustomLocation] = useState("Svalbard");
  const [termsOpen, setTermsOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fishHover, setFishHover] = useState(false);
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const currentTheme = customTheme.trim();
  const currentLocation = customLocation.trim();

  const handleRandomLocation = () => {
    const randomIndex = Math.floor(Math.random() * defaultLocations.length);
    setCustomLocation(defaultLocations[randomIndex]);
  };

  const fetchImages = useCallback(async () => {
    const query = `${currentTheme}, ${currentLocation}`;
  
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&client_id=${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}`
      );
      if (!response.ok) throw new Error("Unsplash failed");
  
      const data = await response.json();
      const fetchedImages = data.results.map(img => ({
        url: img.urls?.regular || "",
        photographer: img.user?.name || "Unknown",
        profileUrl: img.user?.links?.html || null,
        source: "Unsplash"
      }));
  
      if (fetchedImages.length > 0) {
        setImages(fetchedImages);
        setCurrentImageIndex(0);
        return;
      }
    } catch (error) {
      console.error("Unsplash failed, trying Pexels...");
    }
  
    try {
      const pexelsResponse = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10`,
        {
          headers: {
            Authorization: process.env.REACT_APP_PEXELS_API_KEY
          }
        }
      );
      const pexelsData = await pexelsResponse.json();
      const pexelsPhotos = pexelsData.photos.map(photo => ({
        url: photo.src?.landscape || "",
        photographer: photo.photographer || "Unknown",
        profileUrl: photo.photographer_url || null,
        source: "Pexels"
      }));
  
      if (pexelsPhotos.length > 0) {
        setImages(pexelsPhotos);
        setCurrentImageIndex(0);
      }
    } catch (pexelsError) {
      console.error("Failed to fetch images from Pexels too", pexelsError);
    }
  }, [currentTheme, currentLocation]);
  

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleNextManual = useCallback(() => {
    if (images.length === 0) return;
    setTransitioning(true);
    setTimeout(() => {
      const nextIndex = (currentImageIndex + 1) % images.length;
      setCurrentImageIndex(nextIndex);
      setTransitioning(false);
    }, 500);
  }, [images, currentImageIndex]);

  const handlePreviousManual = useCallback(() => {
    if (images.length === 0) return;
    setTransitioning(true);
    setTimeout(() => {
      const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
      setCurrentImageIndex(prevIndex);
      setTransitioning(false);
    }, 500);
  }, [images, currentImageIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNextManual();
    }, 8000);
    return () => clearInterval(interval);
  }, [handleNextManual]);
    const handleUpload = async (e) => {
    e.preventDefault();
    const form = e.target;
    const file = form.image.files[0];

    if (!file) {
      alert('Please select an image.');
      return;
    }

    const toBase64 = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
    });

    const fileBase64 = await toBase64(file);

    const payload = {
      fileBase64,
      fileName: file.name,
      username: form.username.value,
      email: form.email.value,
      tags: form.tags.value,
      location: form.location.value,
    };

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (result.success) {
        alert('Upload successful!');
        form.reset();
        setSubmitOpen(false);
      } else {
        alert('Upload failed: ' + result.error);
      }

    } catch (error) {
      console.error(error);
      alert('Something went wrong.');
    }
  };
  return (
    <div className="App">
      <div className="corner top-left">
        <span className="bold">Hitvis</span>&nbsp;– Feel the vibe before you arrive
      </div>
      <div className="corner top-right">
        <button className="underline corner-button" onClick={() => setAboutOpen(true)}>about</button>
      </div>
     {/* Bottom Left – Credits */}
<div className="corner bottom-left">
  {images.length > 0 ? (
    images[currentImageIndex]?.profileUrl ? (
      <a
        className="underline"
        href={images[currentImageIndex].profileUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Photo by {images[currentImageIndex].photographer} on {images[currentImageIndex].source}
      </a>
    ) : (
      <span className="underline">
        Photo by {images[currentImageIndex].photographer} on {images[currentImageIndex].source}
      </span>
    )
  ) : null}
</div>

{/* Bottom Right – Submit Button */}
<div className="corner bottom-right">
  <button
    className="underline corner-button"
    onClick={() => setSubmitOpen(true)}
  >
    Submit your own photo
  </button>
</div>



      {aboutOpen && (
        <div className="submit-overlay">
          <div className="submit-content">
            <h2>About HITVIS</h2>
            <p><strong>HITVIS lets you instantly feel the atmosphere of places around the world</strong> From vibrant streets and moody skies to buzzing parties and quiet corners.</p>
            <p>It’s a curated visual archive built to capture the vibe of cities, scenes, and moments, through the eyes of photographers everywhere.</p>
            <p><strong>For travelers and the curious:</strong><br />Planning a trip? Dreaming of faraway places? Just exploring? Let HITVIS give you a sense of your next destination before you even go.</p>
            <p><strong>For photographers:</strong><br />Share your perspective and help shape the vibe archive. Your photo with credit can be featured on HITVIS or shared with a global audience.</p>
            <p><strong>Contact</strong><br />Want to contribute, collaborate, or just say hi?<br />
              Email us at <a href="mailto:hitvis@danki.com" target="_blank" rel="noopener noreferrer" className="terms-link">hitvis@danki.com</a>
            </p>
            <div className="submit-actions">
              <button onClick={() => setAboutOpen(false)}>✕ Close</button>
            </div>
            <div className="footer left-footer">Made with ❤️ by Danki Amsterdam</div>
          </div>
        </div>
      )}

      {submitOpen && (
        <div className="submit-overlay">
          <div className="submit-content">
            <h2>Submit Your Photo</h2>
            <form id="hitvis-upload-form" onSubmit={handleUpload}>
        <label>Your photo
  <input type="file" accept="image/*" name="image" required />
</label>

<label>Theme
  <input type="text" placeholder="e.g. vibe, street, sky..." name="tags" required />
</label>

<label>Location
  <input type="text" placeholder="e.g. Tokyo, Lisbon..." name="location" required />
</label>

<label>Your name (optional)
  <input type="text" placeholder="Your name" name="username" />
</label>

<label>Email
  <input type="email" placeholder="you@example.com" name="email" required />
</label>
              <div className="terms-list">
                <p>By uploading a photo, you confirm that you:</p>
                <ul>
                  <li>Own the image or have full rights to share it</li>
                  <li>Do not submit nudity, violence, or hate content</li>
                  <li>Allow Hitvis to display and remix your image</li>
                  <li>Understand that submissions may be removed at our discretion</li>
                </ul>
              </div>
              <div className="checkbox-wrapper">
                <input type="checkbox" id="agree" required />
                <label htmlFor="agree">I agree to these terms</label>
              </div>
              <p style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="underline corner-button link-button"
                >
                  Read full upload terms
                </button>
              </p>
              <div className="submit-actions">
                <button type="submit">Submit</button>
                <button type="button" onClick={() => setSubmitOpen(false)}>✕ Close</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {termsOpen && (
        <div className="submit-overlay">
          <div className="submit-content">
            <h2>Hitvis Upload Terms</h2>
            <ol className="terms-list">
              <li><strong>You must own the image</strong><p>You confirm that you took the photo or have full rights to upload it.</p></li>
              <li><strong>No inappropriate content</strong><p>We don’t allow nudity, violence, hate, or discriminatory material of any kind.</p></li>
              <li><strong>You give us permission to use your image</strong><p>By uploading, you grant Hitvis the right to display, share, and remix your image across our platforms (including social media, etc.).</p></li>
              <li><strong>We may feature your photo publicly</strong><p>Your photo may appear on the Hitvis homepage or be shared with attribution.</p></li>
              <li><strong>We can remove submissions</strong><p>Hitvis reserves the right to reject or remove any image at any time.</p></li>
            </ol>
            <div className="submit-actions">
              <button type="button" onClick={() => setTermsOpen(false)}>✕ Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="overlay" />
      {images.length > 0 && (
        <div
          className={`background ${transitioning ? "fadeout" : "loaded"}`}
          style={{ backgroundImage: `url(${images[currentImageIndex]?.url})` }}
        />
      )}

      <div className="input-bar">
        <input
          type="text"
          placeholder="Your theme"
          value={customTheme}
          onChange={(e) => setCustomTheme(e.target.value)}
        />
        <div
          className="fish-wrapper"
          onClick={handleRandomLocation}
          onMouseEnter={() => setFishHover(true)}
          onMouseLeave={() => setFishHover(false)}
        >
          <img
            src={fishHover ? visHover : visDefault}
            alt="Fish icon"
            className="fish-icon"
            draggable="false"
          />
        </div>
        <input
          type="text"
          placeholder="Your location"
          value={customLocation}
          onChange={(e) => setCustomLocation(e.target.value)}
        />
      </div>

      <div className="main-content">
        <div className="line">
          <span className="word">How's the</span>&nbsp;
          <span className="word underline">{currentTheme}</span>&nbsp;
          <span className="word">in</span>&nbsp;
          <span className="word underline">{currentLocation}?</span>
        </div>
      </div>

      <button className="nav-button left" onClick={handlePreviousManual} aria-label="Previous image">
        <ArrowLeft />
      </button>
      <button className="nav-button right" onClick={handleNextManual} aria-label="Next image">
        <ArrowRight />
      </button>
    </div>
  );
}

export default App;
