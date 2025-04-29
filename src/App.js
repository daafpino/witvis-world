import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

const defaultThemes = ["vibe", "weather", "crowd", "sky", "street", "lights", "party"];
const defaultLocations = [
  "Amsterdam", "Tokyo", "New York", "Berlin", "Paris",
  "Svalbard", "Barcelona", "Cape Town", "Lisbon",
  "Reykjavík", "Seoul", "Sydney", "Cairo", "Mexico City", "Oslo"
];

function App() {
  const [selectedTheme, setSelectedTheme] = useState("vibe");
  const [selectedLocation, setSelectedLocation] = useState("Svalbard");
  const [customTheme, setCustomTheme] = useState("");
  const [customLocation, setCustomLocation] = useState("");

  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [photographer, setPhotographer] = useState("");
  const [source, setSource] = useState("");
  const [randomTransformOrigin, setRandomTransformOrigin] = useState("center center");

  const [aboutOpen, setAboutOpen] = useState(false); // 👈 new state for About panel

  const currentTheme = customTheme.trim() !== "" ? customTheme : selectedTheme;
  const currentLocation = customLocation.trim() !== "" ? customLocation : selectedLocation;

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
        source: "Unsplash"
      }));
      if (fetchedImages.length > 0) {
        setImages(fetchedImages);
        setCurrentImageIndex(0);
        setPhotographer(fetchedImages[0]?.photographer || "Unknown");
        setSource(fetchedImages[0]?.source || "Unsplash");
        return;
      }
    } catch (error) {
      console.error("Unsplash failed, trying Pexels...");
    }

    // Fallback: Pexels
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
        source: "Pexels"
      }));
      if (pexelsPhotos.length > 0) {
        setImages(pexelsPhotos);
        setCurrentImageIndex(0);
        setPhotographer(pexelsPhotos[0]?.photographer || "Unknown");
        setSource(pexelsPhotos[0]?.source || "Pexels");
      }
    } catch (pexelsError) {
      console.error("Failed to fetch images from Pexels too", pexelsError);
    }
  }, [currentTheme, currentLocation]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const nextImage = useCallback(() => {
    if (images.length === 0) return;

    setTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      const origins = ["center center", "top left", "top right", "bottom left", "bottom right"];
      setRandomTransformOrigin(origins[Math.floor(Math.random() * origins.length)]);
      setPhotographer(images[(currentImageIndex + 1) % images.length]?.photographer || "Unknown");
      setSource(images[(currentImageIndex + 1) % images.length]?.source || "");
      setTransitioning(false);
    }, 500);
  }, [images, currentImageIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 8000);
    return () => clearInterval(interval);
  }, [images, nextImage]);

  const handleNextManual = () => {
    nextImage();
  };

  return (
    <div className="App">
      {/* Topbar */}
      <header className="topbar">
    <div className="top-left">
      <div className="logo">WITVIS</div>
    </div>
    <div className="top-center">
      <div className="tagline">Feel the vibe before you arrive</div>
    </div>
    <div className="top-right">
      <div className="about-button" onClick={() => setAboutOpen(true)}>About</div>
    </div>
  </header>

      {/* About Overlay */}
      {aboutOpen && (
        <div className="about-overlay">
          <div className="about-content">
            <h2>About WITVIS</h2>
            <p>
              Feel the real atmosphere of any place in seconds.  
              WITVIS lets you experience the vibe of cities, streets, skies, and parties — 
              through real-time imagery from around the world.
            </p>
            <p>
              Planning a trip? Dreaming of travel?  
              Just curious? Start feeling your next destination today.
            </p>
            <button onClick={() => setAboutOpen(false)}>✕ Close</button>
          </div>
        </div>
      )}

      {/* Overlay + Backgrounds */}
      <div className="overlay" />
      {images.length > 0 && (
        <div
          className={`background ${transitioning ? "fadeout" : "loaded"}`}
          style={{
            backgroundImage: `url(${images[currentImageIndex]?.url})`,
            transformOrigin: randomTransformOrigin,
          }}
        />
      )}

      {/* Inputs */}
      <div className="top-inputs">
        <input
          type="text"
          placeholder="Your theme"
          value={customTheme}
          onChange={(e) => setCustomTheme(e.target.value)}
        />
        <input
          type="text"
          placeholder="Your location"
          value={customLocation}
          onChange={(e) => setCustomLocation(e.target.value)}
        />
      </div>

      {/* Main Line */}
      <div className="main-content">
        <div className="line">
          <span className="word">What's the</span>&nbsp;
          {customTheme ? (
            <span className="word underline">{customTheme}</span>
          ) : (
            <Dropdown options={defaultThemes} selected={selectedTheme} onSelect={setSelectedTheme} />
          )}
          &nbsp;<span className="word">in</span>&nbsp;
          {customLocation ? (
            <span className="word underline">{customLocation}</span>
          ) : (
            <Dropdown options={defaultLocations} selected={selectedLocation} onSelect={setSelectedLocation} />
          )}
          <span className="word">?</span>
        </div>
      </div>

      {/* Credits */}
      {photographer && source && (
        <div className="credit">
          Photo by {photographer} on {source}
        </div>
      )}

      {/* Nav Buttons */}
      <button className="nav-button left" onClick={handleNextManual}>&lt;</button>
      <button className="nav-button right" onClick={handleNextManual}>&gt;</button>

      {/* Footer */}
      <footer className="footer">
        Made with ❤️ by Danki Amsterdam
      </footer>
    </div>
  );
}

function Dropdown({ options, selected, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleSelect = (option) => {
    onSelect(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className={`dropdown ${isOpen ? "open" : ""}`} onClick={toggleOpen}>
      <span className="word underline">{selected}</span>
      {isOpen && (
        <div className="dropdown-wrapper">
          <div className="dropdown-content">
            {options.map((option) => (
              <div
                key={option}
                className="dropdown-item"
                onClick={(e) => { e.stopPropagation(); handleSelect(option); }}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
