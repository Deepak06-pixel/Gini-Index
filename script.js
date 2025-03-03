document.addEventListener("DOMContentLoaded", function () {
    let personalDataBtn = document.getElementById("personal-data-btn");
    let formContainer = document.querySelector(".container.step3 .form-container1");
    const countryDropdown = document.getElementById("country");
    const currencyDisplay = document.getElementById("inr");
    const gniDisplay = document.getElementById("net");
    const populationDisplay = document.getElementById("pop");
    const giniIndexDisplay = document.getElementById("pop1");
    const submitButton = document.getElementById("submitButton");
    const pyramidBlocks = document.querySelectorAll('.pyramid-block');
    const labels = document.querySelectorAll('.label');
    const customPointer = document.getElementById('custom-pointer');

    const higherIncomeElement = document.getElementById("higherIncome");
    const lowerIncomeElement = document.getElementById("lowerIncome");
    const higherIncomeDebtElement = document.getElementById("higherIncomeDebt");
    const lowerIncomeDebtElement = document.getElementById("lowerIncomeDebt");
    const p90p10ResultElement = document.getElementById("p90p10Result");

    let algo1Data = null; // Store Algo 1 API response
    let hoverEnabled = false; // Disable hover initially


    if (personalDataBtn && formContainer) {
        formContainer.style.display = "none";
        personalDataBtn.addEventListener("click", function () {
            formContainer.style.display = formContainer.style.display === "none" ? "block" : "none";
        });
    }

    async function fetchCountries() {
        try {
            const response = await fetch("https://api.antsanalyzer.com/gini/api/countries");
            const data = await response.json();

            countryDropdown.innerHTML = `<option disabled selected>Loading...</option>`; // Temporary placeholder

            let defaultCountry = data.find(country => country.Country.toLowerCase() === "india");

            countryDropdown.innerHTML = "";

            data.forEach(country => {
                const option = document.createElement("option");
                option.value = country.Country;
                option.textContent = country.Country;
                if (defaultCountry && country.Country.toLowerCase() === "india") {
                    option.selected = true;
                }
                countryDropdown.appendChild(option);
            });

            updateCountryStats(defaultCountry || data[0]);
        } catch (error) {
            console.error("Error fetching country data:", error);
        }
    }

    function updateCountryStats(selectedCountry) {
        if (!selectedCountry) return;
        currencyDisplay.textContent = selectedCountry.Currency || "N/A";
        gniDisplay.textContent = selectedCountry.GNI ? selectedCountry.GNI.toLocaleString() : "N/A";
        populationDisplay.textContent = selectedCountry.Population ? selectedCountry.Population.toLocaleString() : "N/A";
        giniIndexDisplay.textContent = selectedCountry.Gini_Coefficient
            ? (selectedCountry.Gini_Coefficient * 100).toFixed(2) + "%"
            : "N/A";
    }

    async function fetchGiniPyramid(selectedCountry) {
        try {
            if (!selectedCountry) return;

            const payload = {
                "pop": selectedCountry.Population,
                "geni_i": selectedCountry.Gini_Coefficient,
                "gni": selectedCountry.GNI,
                "pct": [0, 10.00, 30.00, 50.00, 80.00, 90.00, 95.00, 98.00, 100.00]
            };

            const response = await fetch("https://api.antsanalyzer.com/gini/api/algo1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("API Error: " + response.status);
            algo1Data = await response.json(); // Store API response
            hoverEnabled = true; // Enable hover after calculations
        } catch (error) {
            console.error("Error fetching Algo 1 data:", error);
            algo1Data = null;
            hoverEnabled = false;
        }
    }

    countryDropdown.addEventListener("change", async function () {
        try {
            const response = await fetch("https://api.antsanalyzer.com/gini/api/countries");
            const countries = await response.json();
            const selectedCountry = countries.find(c => c.Country === countryDropdown.value);
            if (selectedCountry) updateCountryStats(selectedCountry);
        } catch (error) {
            console.error("Error updating country data:", error);
        }
});

    async function computeUserNoDebt(payload) {
        try {
            const response = await fetch("https://api.antsanalyzer.com/gini/api/algo2/compute-user-nodebt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error("Error computing user position without debt:", error);
            return { pct_low: 0 };
        }
    }

    async function computeUserWithDebt(payload) {
        try {
            const response = await fetch("https://api.antsanalyzer.com/gini/api/algo3/compute-user-withdebt", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error("Error computing user position with debt:", error);
            return { pct_low: 0 };
        }
    }

    async function computeP90P10(payload) {
        try {
            const response = await fetch("https://api.antsanalyzer.com/gini/api/algo4/compute-p90p10", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Error computing P90/P10 ratio:", error);
            return { p90p10_ratio: null };
        }
    }
    function adjustLayout() {
        const screenWidth = window.innerWidth;
        const container = document.querySelector(".container.step3");
        const formContainer = document.querySelector(".form-container1");
        const pyramid = document.querySelector(".pyramid-container");
        
        if (screenWidth < 768) {
            // Mobile View
            if (container) container.style.flexDirection = "column";
            if (formContainer) formContainer.style.width = "100%";
            if (pyramid) pyramid.style.width = "90%";
        } else {
            // Desktop View
            if (container) container.style.flexDirection = "row";
            if (formContainer) formContainer.style.width = "50%";
            if (pyramid) pyramid.style.width = "70%";
        }
    }

    // Adjust layout on page load and window resize
    adjustLayout();
    window.addEventListener("resize", adjustLayout);

    // (Rest of your existing code remains unchanged)

    function allowOnlyNumbers(input, maxLength) {
        input.addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, "").slice(0, maxLength);
        });

        input.addEventListener("paste", function (event) {
            event.preventDefault();
            const pastedData = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, maxLength);
            document.execCommand("insertText", false, pastedData);
        });
    }

    const incomeInput = document.getElementById("income");
    const debtInput = document.getElementById("emi");
    const dependentsInput = document.getElementById("dependents");
    const ageInput = document.getElementById("age");

    allowOnlyNumbers(incomeInput, 7);
    allowOnlyNumbers(debtInput, 5);
    allowOnlyNumbers(dependentsInput, 1);


    submitButton.addEventListener("click", async () => {
        submitButton.innerHTML = "Calculating...";
        submitButton.disabled = true;

        const monthlyIncome = parseFloat(document.getElementById("income").value);
        const monthlyDebt = parseFloat(document.getElementById("emi").value);
        const dependents = parseInt(document.getElementById("dependents").value);
        const selectedCountry = document.getElementById("country").value;

        try {
            const countryResponse = await fetch("https://api.antsanalyzer.com/gini/api/countries");
            const countries = await countryResponse.json();
            const countryData = countries.find(c => c.Country === selectedCountry);
            if (!countryData) throw new Error("Country data not found.");

            await fetchGiniPyramid(countryData); // Fetch Algo 1 Data

            const { Population, GNI, Gini_Coefficient } = countryData;
            const alpha = 1.695652;

            const noDebtData = await computeUserNoDebt({ mon_inc: monthlyIncome, population: Population, nni: GNI, alpha, geni: Gini_Coefficient, dependents });
            const withDebtData = await computeUserWithDebt({ mon_inc: monthlyIncome, mon_debt: monthlyDebt, population: Population, nni: GNI, alpha, geni: Gini_Coefficient, dependents });
            const p90p10Data = await computeP90P10({ population: Population, nni: GNI, geni: Gini_Coefficient, alpha });

            document.querySelector("#final-info").style.display = "flex";
            document.querySelector(".step3").style.display = "none";

            const totalPopulation = 100000;

            // Update percentile scores
            document.querySelector("#final-info .final-info1:nth-child(1) .percentile h1:nth-child(2)").innerText = `${(noDebtData.pct_low * 100).toFixed(2)} %`;
            document.querySelector("#final-info .final-info1:nth-child(2) .percentile h1:nth-child(2)").innerText = `${(withDebtData.pct_low * 100).toFixed(2)} %`;

            // Calculate number of citizens above and below
            if (higherIncomeElement && lowerIncomeElement) {
                higherIncomeElement.innerText = Math.round(totalPopulation * (1 - noDebtData.pct_low)).toLocaleString();
                lowerIncomeElement.innerText = Math.round(totalPopulation * noDebtData.pct_low).toLocaleString();
            }

            if (higherIncomeDebtElement && lowerIncomeDebtElement) {
                higherIncomeDebtElement.innerText = Math.round(totalPopulation * (1 - withDebtData.pct_low)).toLocaleString();
                lowerIncomeDebtElement.innerText = Math.round(totalPopulation * withDebtData.pct_low).toLocaleString();
            }

            if (p90p10ResultElement) {
                p90p10ResultElement.innerText = p90p10Data.p90p10_ratio.toFixed(2);
            }

        } catch (error) {
            console.error("Error processing data:", error);
            alert("Error calculating data. Please try again.");
        } finally {
            submitButton.innerHTML = "Submit";
            submitButton.disabled = false;
        }
    });

    fetchCountries();
    
    document.getElementById("userGuideIcon").addEventListener("click", function () {
        document.getElementById("userGuideModal").style.display = "flex";
    });
    
    document.querySelector(".close").addEventListener("click", function () {
        document.getElementById("userGuideModal").style.display = "none";
    });
    
    window.addEventListener("click", function (event) {
        if (event.target === document.getElementById("userGuideModal")) {
            document.getElementById("userGuideModal").style.display = "none";
        }
    });
    
    pyramidBlocks.forEach((block, index) => {
        block.addEventListener("mouseover", (e) => {
            if (!hoverEnabled || !algo1Data) return;
    
            // Ensure algo1Data has the correct properties
            if (!algo1Data.p || !algo1Data.is || !algo1Data.Ai || !algo1Data.Lx) {
                console.error("Missing required data in algo1Data:", algo1Data);
                return;
            }
    
            // Validate index exists in the arrays
            if (
                index >= algo1Data.p.length ||
                index >= algo1Data.is.length ||
                index >= algo1Data.Ai.length ||
                index >= algo1Data.Lx.length
            ) {
                console.warn(`Index ${index} is out of bounds for algo1Data arrays.`);
                return;
            }
    
            // Get data safely
            const level = index + 1;
            const population = algo1Data.p[index]?.toLocaleString() || "N/A"; // Changed from pop to p
            const totalIncome = algo1Data.is[index]?.toLocaleString() || "N/A";
            const avgIncome = algo1Data.Ai[index]?.toLocaleString() || "N/A";
            const pctPopulation = algo1Data.Lx[index]?.toFixed(2) || "N/A"; // Changed from pct2 - pct1 to Lx
    
            // Update label content
            labels[index].innerHTML = `
                Level: ${level} <br>
                Population: ${population} <br>
                Total Income: ${totalIncome} <br>
                Average Income: ${avgIncome} <br>
                Population percentage: ${pctPopulation}%
            `;
    
            labels[index].style.opacity = "1"; // Make label visible
            customPointer.style.display = "block";
            customPointer.style.left = labels[index].offsetLeft - 30 + "px";
            customPointer.style.top = labels[index].offsetTop + "px";
        });
    
        block.addEventListener("mouseout", () => {
            labels[index].style.opacity = "0";
            customPointer.style.display = "none";
        
        });
    });

});
