import React, { useEffect, useState, useCallback } from "react";
import "./App.css";
import { ReactComponent as ArrowLeft } from "./assets/ArrowLeft.svg";
import { ReactComponent as ArrowRight } from "./assets/ArrowRight.svg";
import vis from "./assets/vis.svg";

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
  const [profileUrl, setProfileUrl] = useState("");
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
profileUrl: img.user?.links?.html || "#",

        source: "Unsplash"
      }));
      if (fetchedImages.length > 0) {
        setImages(fetchedImages);
        setCurrentImageIndex(0);
        setPhotographer(fetchedImages[0]?.photographer || "Unknown");
        setSource(fetchedImages[0]?.source || "Unsplash");
        setProfileUrl(fetchedImages[0]?.profileUrl || "#");
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
profileUrl: photo.photographer_url || "#",

        source: "Pexels"
      }));
      if (pexelsPhotos.length > 0) {
        setImages(pexelsPhotos);
        setCurrentImageIndex(0);
        setPhotographer(pexelsPhotos[0]?.photographer || "Unknown");
        setSource(pexelsPhotos[0]?.source || "Pexels");
        setProfileUrl(pexelsPhotos[0]?.profileUrl || "#");
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
      const nextIndex = (currentImageIndex + 1) % images.length;
  
      setCurrentImageIndex(nextIndex);
      setPhotographer(images[nextIndex]?.photographer || "Unknown");
      setSource(images[nextIndex]?.source || "");
      setProfileUrl(images[nextIndex]?.profileUrl || "#");
  
      const origins = ["center center", "top left", "top right", "bottom left", "bottom right"];
      setRandomTransformOrigin(origins[Math.floor(Math.random() * origins.length)]);
  
      setTransitioning(false);
    }, 500);
  }, [images, currentImageIndex]); // ✅ properly closed here
  

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
      <div className="corner top-left">
  <span className="bold">Hitvis</span>&nbsp;– Feel the vibe before you arrive
</div>

<div className="corner top-right">
<button
  className="underline corner-button"
  onClick={() => setAboutOpen(true)}
>
  about
</button>

</div>
<div className="corner bottom-left">
  <a
    className="underline"
    href={profileUrl}
    target="_blank"
    rel="noopener noreferrer"
  >
    Photo by {photographer} on {source}
  </a>
</div>

<div className="corner bottom-right">
<button className="underline corner-button">
  Submit your own photo
</button>
</div>

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

      {/* ✅ Add this here */}
      <div className="footer">
        Made with ❤️ by Danki Amsterdam
      </div>
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

<div className="input-bar">
  <input
    type="text"
    placeholder="Your theme"
    value={customTheme}
    onChange={(e) => setCustomTheme(e.target.value)}
  />
  
  <div className="fish-wrapper">
    <img src={vis} alt="Fish icon" className="fish-icon" />
  </div>

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
    <span className="word">How's the</span>&nbsp;
    {customTheme ? (
      <span className="word underline">{customTheme}</span>
    ) : (
      <Dropdown options={defaultThemes} selected={selectedTheme} onSelect={setSelectedTheme} />
    )}
    &nbsp;<span className="word">in</span>&nbsp;
    {customLocation ? (
      <span className="word underline">{customLocation}?</span> // 👈 add ? here
    ) : (
      <span className="word">
        <Dropdown
          options={defaultLocations}
          selected={selectedLocation}
          onSelect={setSelectedLocation}
        />
        ?
      </span>
    )}
  </div>
</div>


        {/* Nav Buttons */}
        <button className="nav-button left" onClick={handleNextManual} aria-label="Previous image">
  <ArrowLeft />
</button>

<button className="nav-button right" onClick={handleNextManual} aria-label="Next image">
  <ArrowRight />
</button>
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
