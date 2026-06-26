# Atorvastatin Pharmacokinetics Simulator

An interactive, educational web application designed to simulate the in vitro dissolution and in vivo pharmacokinetics (PK) of Atorvastatin. 

Unlike typical one-compartment models, this application integrates numerical integration (Euler's method) to realistically simulate drug absorption phenomena such as **Transporter Kinetics** and **High Hepatic First-Pass Metabolism**.

## 🚀 Features

*   **Interactive Dosing:** Select between standard clinical doses (10 mg, 20 mg, 40 mg, 80 mg).
*   **First-Pass Metabolism ($E_H$):** Atorvastatin suffers from extensive first-pass metabolism in the gut wall and liver. The simulation includes an adjustable Hepatic Extraction Ratio ($E_H$) to accurately reflect its low clinical absolute bioavailability (~14%).
*   **Transporter Saturation:** Integrates Michaelis-Menten kinetics ($V_{max}$, $K_m$) to simulate transporter-mediated absorption (e.g., OATP1B1).
*   **Physical Tablet State:** Compare the PK profile of a "Full Tablet" versus a tablet "Broken in Half". Breaking the tablet increases the surface area by an estimated 1.32x, accelerating the Noyes-Whitney dissolution rate and shifting the $T_{max}$ and $C_{max}$.
*   **Real-time Charts:** Built with Chart.js to dynamically plot the Dissolution Profile (% Dissolved vs Time) and Plasma Concentration-Time Profile (ng/mL vs Time).
*   **Premium UI:** A modern, responsive dashboard built with pure HTML, CSS, and Vanilla JavaScript.

## 🔬 Clinical Parameters Default

*   **Volume of Distribution ($V_d$):** ~381 L
*   **Elimination Half-life ($t_{1/2}$):** ~7.0 hours
*   **Target $C_{max}$:** ~25 ng/mL for a 40 mg dose
*   **Target Bioavailability ($F$):** ~14%

## 🛠️ How to Run Locally

This is a static front-end application. No complex build tools or `node_modules` are required.

1.  Clone or download this repository.
2.  Open the `atorvastatin-simulator` folder.
3.  Double-click `index.html` to open it directly in any modern web browser.
4.  *(Optional)* If you prefer running it through a local server, you can use Python:
    ```bash
    python -m http.server 8080
    ```
    Then visit `http://localhost:8080/atorvastatin-simulator/` in your browser.

## 🌐 How to Deploy to GitHub Pages

1. Create a new public repository on GitHub (e.g., `atorvastatin-simulator`).
2. Upload the `index.html`, `style.css`, `app.js`, and `README.md` files to the repository.
3. Go to your repository's **Settings** > **Pages**.
4. Under **Source**, select the `main` (or `master`) branch and click **Save**.
5. Wait 1-2 minutes, and your simulator will be live and accessible via a public URL!

## 📜 License

This project is intended for educational and demonstrative purposes in pharmaceutical sciences. It is not intended for medical advice or diagnostic use.
