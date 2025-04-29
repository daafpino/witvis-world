import React, { useEffect, useState, useCallback } from "react";
import "./App.css";

const themes = ["vibe", "weather", "crowd", "sky", "street", "lights", "party"];
const locations = [
  "Amsterdam", "Tokyo", "New York", "Berlin", "Paris",
  "Svalbard", "Barcelona", "Cape Town", "Lisbon",
  "Reykjavík", "Seoul", "Sydney", "Cairo", "Mexico City", "Oslo"
];

function App() {
  const [selectedTheme, setSelectedTheme] = useState("vibe");
  const [selectedLocation, setSelectedLocation] = useState("Svalbard");
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photographer, setPhotographer] = useState("");
  const [source, setSource] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [randomOrigin, setRandomOrigin] = useState("center center");

  const fetchImages = useCallback(async () => {
    const query = `${selectedTheme}, ${selectedLocation}`;

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
        setCurrentIndex(0);
        setPhotographer(fetchedImages[0]?.photographer || "Unknown");
        setSource("Unsplash");
      }
    } catch (error) {
      console.error("Unsplash failed, trying Pexels...");
      try {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10`,
          { headers: { Authorization: process.env.REACT_APP_PEXELS_API_KEY } }
        );
        const data = await response.json();
        const fetchedImages = data.photos.map(photo => ({
          url: photo.src?.landscape || "",
          photographer: photo.photographer || "Unknown",
          source: "Pexels"
        }));
        if (fetchedImages.length > 0) {
          setImages(fetchedImages);
          setCurrentIndex(0);
          setPhotographer(fetchedImages[0]?.photographer || "Unknown");
          setSource("Pexels");
        }
      } catch (err) {
        console.error("Both Unsplash and Pexels failed", err);
      }
    }
  }, [selectedTheme, selectedLocation]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const nextImage = useCallback(() => {
    if (images.length < 1) return;
    setTransitioning(true);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      const newOrigins = ["center center", "top left", "top right", "bottom left", "bottom right"];
      setRandomOrigin(newOrigins[Math.floor(Math.random() * newOrigins.length)]);
      setPhotographer(images[(currentIndex + 1) % images.length]?.photographer || "Unknown");
      setSource(images[(currentIndex + 1) % images.length]?.source || "");
      setTransitioning(false);
    }, 500); // match transition duration
  }, [images, currentIndex]);

  const prevImage = useCallback(() => {
    if (images.length < 1) return;
    setTransitioning(true);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      const newOrigins = ["center center", "top left", "top right", "bottom left", "bottom right"];
      setRandomOrigin(newOrigins[Math.floor(Math.random() * newOrigins.length)]);
      setPhotographer(images[(currentIndex - 1 + images.length) % images.length]?.photographer || "Unknown");
      setSource(images[(currentIndex - 1 + images.length) % images.length]?.source || "");
      setTransitioning(false);
    }, 500);
  }, [images, currentIndex]);

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(nextImage, 7000); // every 7 seconds
      return () => clearInterval(interval);
    }
  }, [images, nextImage]);

  return (
    <div className="App">
      <div className="overlay"></div>

      <div className="background-container">
        {images.length > 0 && (
          <>
            <div
              className={`background ${transitioning ? "fadeout" : "visible"}`}
              style={{
                backgroundImage: `url(${images[currentIndex]?.url})`,
                transformOrigin: randomOrigin
              }}
            />
          </>
        )}
      </div>

      <div className="line">
        <span className="word">What's the</span>&nbsp;
        <Dropdown options={themes} selected={selectedTheme} onSelect={setSelectedTheme} />&nbsp;
        <span className="word">like in</span>&nbsp;
        <Dropdown options={locations} selected={selectedLocation} onSelect={setSelectedLocation} />&nbsp;
        <span className="word">?</span>
      </div>

      {photographer && (
        <div className="credit">
          Photo by {photographer} on {source}
        </div>
      )}

      {images.length > 1 && (
        <>
          <button className="nav-button left" onClick={prevImage}>&lt;</button>
          <button className="nav-button right" onClick={nextImage}>&gt;</button>
        </>
      )}
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
    const close = (e) => {
      if (!e.target.closest('.dropdown')) setIsOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
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
