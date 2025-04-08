document.addEventListener("DOMContentLoaded", function() {
    // Parse and display initial results if they exist
    const fullResponseElement = document.getElementById("full-response");
    if (fullResponseElement) {
        const responseText = fullResponseElement.textContent;
        parseAndDisplayResults(responseText);
    }

    // Add event listeners to the info buttons
    const infoButtons = document.querySelectorAll(".info-btn");
    infoButtons.forEach(button => {
        button.addEventListener("click", function() {
            showDetail(this.getAttribute("data-type"));
        });
    });

    // Handle form submission
    const form = document.getElementById("symptom-form");
    if (form) {
        form.addEventListener("submit", function(event) {
            // Form will be submitted normally, no need to prevent default
            // This is handled by the Flask route
        });
    }
});

function parseAndDisplayResults(responseText) {
    // Extract the predicted disease first (improved regex)
    let diseaseMatch = responseText.match(/Predicted Disease:?\s*([\s\S]*?)(?=Recommended Diet:|$)/i);
    let predictedDisease = "Not Available";
    
    if (diseaseMatch && diseaseMatch[1]) {
        predictedDisease = diseaseMatch[1].trim();
        // Remove any asterisks, bullets, or markdown formatting
        predictedDisease = cleanText(predictedDisease);
    }
    
    // Display the predicted disease
    document.getElementById("disease-content").textContent = predictedDisease;

    // Store the entire parsed response for use with buttons
    window.parsedResponse = {
        disease: predictedDisease,
        diet: extractPoints(responseText, /Recommended Diet:?\s*([\s\S]*?)(?=Foods to Avoid:|$)/i),
        avoid: extractPoints(responseText, /Foods to Avoid:?\s*([\s\S]*?)(?=Recommended Workouts:|$)/i),
        workout: extractPoints(responseText, /Recommended Workouts:?\s*([\s\S]*?)(?=Type of Doctor|$)/i),
        doctor: extractPoints(responseText, /Type of Doctor to Consult:?\s*([\s\S]*?)(?=$)/i)
    };
}

// Function to clean text by removing markdown symbols
function cleanText(text) {
    return text.replace(/\*/g, '')  // Remove asterisks
               .replace(/^\s*[-•]\s*/gm, '')  // Remove bullet points at the start of lines
               .replace(/^\s*\d+\.\s*/gm, '')  // Remove numbered lists
               .trim();
}

function extractPoints(text, regex) {
    const match = text.match(regex);
    if (!match || !match[1]) return ["Information not available"];
    
    // Extract the content portion
    let content = match[1].trim();
    
    // Split by new lines or bullet points
    let points = content.split(/\n|•|\*\*/).map(item => {
        // Clean each item to remove asterisks and other markdown
        return cleanText(item);
    }).filter(item => item.length > 0);
    
    // If no points were extracted or it's just a single sentence, return as is
    if (points.length === 0) {
        return [cleanText(content)];
    } else if (points.length === 1 && !content.includes("•") && !content.includes("-")) {
        // Check if the single point has commas that could indicate a list
        if (points[0].includes(",")) {
            return points[0].split(",").map(item => cleanText(item)).filter(item => item.length > 0);
        }
        return points;
    }
    
    return points;
}

function showDetail(type) {
    // Highlight selected button
    document.querySelectorAll(".info-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    document.querySelector(`.info-btn[data-type="${type}"]`).classList.add("active");
    
    // Update detail title
    const titles = {
        "diet": "Recommended Diet Plan",
        "avoid": "Foods to Avoid",
        "workout": "Recommended Workouts",
        "doctor": "Type of Doctor to Consult"
    };
    
    document.getElementById("detail-title").textContent = titles[type];
    
    // Clear and populate the list
    const listElement = document.getElementById("detail-list");
    listElement.innerHTML = "";
    
    if (window.parsedResponse && window.parsedResponse[type]) {
        window.parsedResponse[type].forEach(point => {
            const li = document.createElement("li");
            li.textContent = point;
            listElement.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "Information not available";
        listElement.appendChild(li);
    }
}