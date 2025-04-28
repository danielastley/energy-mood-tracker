// --- Global Variables & DOM Elements ---
         // Define them here, but assign values inside DOMContentLoaded
         let currentPageIndex = 0;
         let pages, prevBtn, nextBtn, submitBtn, feedbackElement, form;
         let energySliderDiv, moodSliderDiv, energyDescDiv, moodDescDiv, energyValueInput, moodValueInput;
 
         // --- Descriptions Mapping (Keep as before) ---
         const energyDescriptions = [ /* ... your 10 energy descriptions ... */
             "Completely depleted - Feel like even basic movements require enormous effort; struggle to get out of bed or perform simple daily tasks.", "Running on fumes - Can accomplish necessary tasks but with great difficulty; need frequent breaks and feel exhausted afterward.", "Energy comes in brief waves - Experience occasional bursts of motivation that quickly fade; can start tasks but rarely finish them.", "Low and steady - Have just enough energy for basic responsibilities but nothing extra; social activities feel overwhelming.", "Functioning but fatigued - Can get through the day but feel a constant underlying tiredness; need to carefully budget energy.", "Moderate and sustainable - Have sufficient energy for normal daily activities without feeling drained; can engage socially.", "Pleasantly energized - Feel a positive drive to accomplish tasks and engage with others; bounce back quickly from exertion.", "Vibrantly productive - Experience a natural flow of sustained energy; easily move from one activity to another without fatigue.", "Highly charged - Feel an abundance of physical and mental energy; might have difficulty sitting still or focusing on one thing.", "Intensely wired - Experience racing thoughts and a compulsive need to be in constant motion; may feel overwhelming or unsustainable."
          ];
         const moodDescriptions = [ /* ... your 10 mood descriptions ... */
             "Deeply despondent - Feel an overwhelming sense of hopelessness; see no possibility for improvement and may have thoughts of giving up.", "Persistently gloomy - Experience a heavy, dark mood that colors everything negatively; find it difficult to imagine feeling better.", "Quietly sad - Feel a gentle but constant sadness; moments of neutrality may occur but joy seems distant or unattainable.", "Numbly detached - Experience emotional flatness; neither particularly sad nor happy, just disconnected from feelings altogether.", "Cautiously neutral - Feel relatively balanced but fragile; aware that mood could easily tip in either direction with small triggers.", "Calmly content - Experience a gentle baseline of satisfaction; not excited but appreciative of small pleasures.", "Warmly positive - Feel a consistent undercurrent of optimism; able to find enjoyment in activities and connections.", "Genuinely joyful - Experience frequent moments of delight and happiness; easily find humor and pleasure in everyday situations.", "Excitedly enthusiastic - Feel intensely positive emotions; see opportunities everywhere and approach life with eager anticipation.", "Euphoric and intense - Experience an overwhelming sense of elation; everything feels significant and meaningful, potentially to an unsustainable degree."
         ];
 
         // Function to get description index (Keep as before)
         function getDescriptionIndex(value) {
             const clampedValue = Math.max(0, Math.min(100, Number(value)));
             let index = Math.floor(clampedValue / 10);
             if (index === 10) index = 9;
              return index;
         }
 
          // --- Update Display Functions (Simplified Debug Version) ---
          function updateEnergyDisplay(value) {
              console.log("Updating Energy Display. Value:", value); // DEBUG
              if (energyDescDiv && energyValueInput) {
                  const index = getDescriptionIndex(value);
                  console.log("Energy Index:", index); // DEBUG
                  if (index >= 0 && index < energyDescriptions.length) {
                      energyDescDiv.textContent = energyDescriptions[index];
                  } else {
                      console.error("Invalid index for energy description:", index);
                      energyDescDiv.textContent = "Error loading description."; // Show error
                  }
                  energyValueInput.value = value; // Update hidden input
              } else {
                  console.error("Energy description or input element not found!");
              }
          }
          function updateMoodDisplay(value) {
              console.log("Updating Mood Display. Value:", value); // DEBUG
              if (moodDescDiv && moodValueInput) {
                  const index = getDescriptionIndex(value);
                  console.log("Mood Index:", index); // DEBUG
                  if (index >= 0 && index < moodDescriptions.length) {
                      moodDescDiv.textContent = moodDescriptions[index];
                  } else {
                     console.error("Invalid index for mood description:", index);
                      moodDescDiv.textContent = "Error loading description."; // Show error
                  }
                  moodValueInput.value = value; // Update hidden input
              } else {
                 console.error("Mood description or input element not found!");
              }
          }
 
 
         // --- Initialize Sliders (Reverted to simpler 'pie' version, keep gradient CSS) ---
         function initializeSliders() {
              const commonSliderOptions = {
                  radius: 110,
                  width: 20,
                  handleSize: "+0",
                  handleShape: "round",
                  sliderType: "min-range",
                  value: 50, // Default 50%
                  min: 0,
                  max: 100,
                  step: 1,
                  // Revert to pie shape - orientation might still be off, we address later
                  startAngle: -45, // Pie shape often uses 90 (top) as reference
                  endAngle: "+180", // Full circle for pie
                  circleShape: "pie",
                  readOnly: false,
                  disabled: false,
                  showTooltip: true, // Show default tooltip (shows number 0-100)
                  // Replace 'tooltipFormat: "tooltipVal",' with this function:
                 tooltipFormat: function (args) {
                     const sliderId = $(this.control).attr("id");
                     if (sliderId === 'energySliderContainer') {
                         return "Energy"; // Text for the energy slider center
                     } else if (sliderId === 'moodSliderContainer') {
                         return "Mood";   // Text for the mood slider center
                     }
                     // Fallback if ID doesn't match (shouldn't happen)
                     return ""; // Return empty string or args.value if preferred
                 }, // Make sure there's a comma after this closing brace if other options follow
              };
 
              // Initialize Energy Slider
              energySliderDiv.roundSlider({
                  ...commonSliderOptions,
                   // Ensure events update our functions AND the hidden input
                   create: function(args) { updateEnergyDisplay(args.value); },
                   valueChange: function(args) { updateEnergyDisplay(args.value); },
                   drag: function(args) { updateEnergyDisplay(args.value); }
              });
 
              // Initialize Mood Slider
              moodSliderDiv.roundSlider({
                  ...commonSliderOptions,
                   // Ensure events update our functions AND the hidden input
                   create: function(args) { updateMoodDisplay(args.value); },
                   valueChange: function(args) { updateMoodDisplay(args.value); },
                   drag: function(args) { updateMoodDisplay(args.value); }
              });
         }
 
 
         // --- Pagination Logic (Keep as before) ---
         function showPage(index) {
              if (!pages || pages.length === 0) { console.error("Pages not found"); return; }
             pages.forEach((page, i) => {
                 page.classList.toggle('active', i === index);
             });
              if (prevBtn) prevBtn.disabled = index === 0;
              if (nextBtn) nextBtn.style.display = index === pages.length - 1 ? 'none' : 'inline-block';
              if (submitBtn) submitBtn.style.display = index === pages.length - 1 ? 'inline-block' : 'none';
         }
         function navigatePage(direction) {
             const newIndex = currentPageIndex + direction;
              if (pages && newIndex >= 0 && newIndex < pages.length) {
                 currentPageIndex = newIndex;
                 showPage(currentPageIndex);
             } else {
                 console.warn("Navigation prevented: Index out of bounds or pages not found.");
             }
         }
 
 
         // --- Initialization and Feedback (Keep revisions) ---
         document.addEventListener('DOMContentLoaded', () => {
             console.log("DOM Loaded"); // DEBUG
              // Assign global DOM element variables
              pages = document.querySelectorAll('.page');
              prevBtn = document.getElementById('prevBtn');
              nextBtn = document.getElementById('nextBtn');
              submitBtn = document.getElementById('submitBtn');
              feedbackElement = document.getElementById('feedbackMessage');
              form = document.getElementById('trackerForm');
              energySliderDiv = $("#energySliderContainer");
              moodSliderDiv = $("#moodSliderContainer");
              energyDescDiv = document.getElementById('energyDescription');
              moodDescDiv = document.getElementById('moodDescription');
              energyValueInput = document.getElementById('energyValueInput');
              moodValueInput = document.getElementById('moodValueInput');
 
              // Add checks before initializing/adding listeners
              if (energySliderDiv.length > 0 && moodSliderDiv.length > 0) {
                  console.log("Initializing sliders..."); // DEBUG
                  initializeSliders();
              } else {
                  console.error("Slider container elements not found!");
              }
 
              if (pages.length > 0) {
                  console.log("Showing initial page."); // DEBUG
                  showPage(currentPageIndex);
              } else {
                   console.error("Page elements not found!");
              }
 
              // Feedback Message Logic (Keep as before)
              // ... (code for status === 'success' / status === 'error') ...
              const urlParams = new URLSearchParams(window.location.search);
              const status = urlParams.get('status');
              if (status === 'success') {
                // Use innerHTML to include the link
                feedbackElement.innerHTML = 'Check-in saved successfully! You can close this window or <a href="dashboard.html">View Dashboard</a>.'; // MODIFIED LINE
                feedbackElement.className = 'success';
                feedbackElement.style.display = 'block';
                try {
                    energySliderDiv.roundSlider("setValue", 50);
                    moodSliderDiv.roundSlider("setValue", 50);
                } catch(e) { console.error("Error resetting sliders:", e);}
                updateEnergyDisplay(50);
                updateMoodDisplay(50);
                window.history.replaceState({}, document.title, window.location.pathname);
                // No auto-hide
            } else if (status === 'error') { // Keep error handling as is
                const message = urlParams.get('message') || 'Failed to save data. Please try again.';
"                feedbackElement.textContent = 'Check-in saved successfully! You can now close this window.';
"                feedbackElement.className = 'error';
                feedbackElement.style.display = 'block';
                window.history.replaceState({}, document.title, window.location.pathname);
            }
 
 
              // Setup navigation button clicks ONLY if buttons exist
              if(prevBtn) {
                  console.log("Adding listener to Prev button"); // DEBUG
                  prevBtn.addEventListener('click', () => navigatePage(-1));
              } else {
                  console.error("Previous button not found!");
              }
              if(nextBtn) {
                  console.log("Adding listener to Next button"); // DEBUG
                  nextBtn.addEventListener('click', () => navigatePage(1));
              } else {
                  console.error("Next button not found!");
              }
              // No listener needed for submit button as it's type="submit"
 
         }); // End DOMContentLoaded