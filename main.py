from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from groq import Groq
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
app.secret_key = "1234"

# Initialize Groq client
groq_client = Groq(api_key="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")

# Connect to MySQL
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="praveen",
        database="user_data"
    )

# Symptom severity logic
def assess_severity(symptoms_str):
    if not symptoms_str:
        return "No symptoms provided"
    
    symptoms_list = [s.strip().lower() for s in symptoms_str.split(',')]
    symptoms = set(symptoms_list)

    mild_symptoms = {"runny nose", "mild headache", "sneezing", "fatigue"}
    moderate_symptoms = {"fever", "body ache", "persistent cough", "nausea"}
    severe_symptoms = {"high fever", "chest pain", "shortness of breath", "loss of consciousness"}

    mild_count = len(mild_symptoms.intersection(symptoms))
    moderate_count = len(moderate_symptoms.intersection(symptoms))
    severe_count = len(severe_symptoms.intersection(symptoms))

    if severe_count > 0:
        return "⚠️ Severe - Seek emergency medical care immediately!"
    elif moderate_count > 0:
        return "⚠️ Moderate - Consult a doctor for proper evaluation."
    else:
        return "✅ Mild - Home remedies and rest should help."

@app.route('/predict', methods=['POST'])
def predict():
    try:
        symptoms = request.form.get("symptoms")
        if not symptoms:
            return render_template("main.html", error="No symptoms provided. Please enter symptoms.")

        severity = assess_severity(symptoms)

        try:
            chat_completion = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": (
                        "You are a healthcare assistant named Nova. "
                        "When given symptoms, predict the disease and respond in a structured format including: "
                        "Predicted Disease, Recommended Diet, Foods to Avoid, Recommended Workouts, and the Type of Doctor to Consult. "
                        "For each category, provide the information as a bullet-point list."
                    )},
                    {"role": "user", "content": f"I have the following symptoms: {symptoms}. What should I do?"}
                ]
            )
            response = chat_completion.choices[0].message.content.strip()
        except Exception as api_error:
            response = "Sorry, I'm unable to analyze your symptoms right now. Please try again later."

        return render_template("main.html", response_data={
            "Symptoms_Provided": symptoms,
            "Severity_Level": severity,
            "Response": response
        })

    except Exception as e:
        return render_template("main.html", error=f"An error occurred: {str(e)}")

@app.route('/signup', methods=['POST'])
def signup():
    try:
        full_name = request.form.get("FullName")
        email = request.form.get("Email")
        password = request.form.get("Password")
        confirm_password = request.form.get("ConfirmPassword")

        if password != confirm_password:
            return jsonify({"error": "Passwords do not match"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO users (full_name, email, password) VALUES (%s, %s, %s)",
                       (full_name, email, password))
        conn.commit()
        cursor.close()
        conn.close()

        return render_template("login.html")
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        email = request.form.get("Email")
        password = request.form.get("Password")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE email=%s AND password=%s", (email, password))
        user = cursor.fetchone()
        cursor.close()
        conn.close()

        if user:
            session['email'] = user['email']
            session['full_name'] = user['full_name']
            return render_template('main.html')
        else:
            return jsonify({"error": "Invalid email or password"}), 401

    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route("/render_signup_page")
def render_signup_page():
    return render_template("signup.html")

@app.route("/render_login_page")
def render_login_page():
    return render_template("login.html")

@app.route("/render_aboutus")
def render_aboutus():
    return render_template("about.html")

@app.route("/render_contact")
def render_contact():
    return render_template("contact.html")

@app.route("/render_bot_page")
def render_bot_page():
    if 'email' in session:
        return render_template("main.html")
    else:
        return redirect(url_for("render_login_page"))

@app.route("/home")
def render_home_page():
    return redirect(url_for("home"))

@app.route("/")
def home():
    return render_template("front.html")

@app.route("/hospital")
def hospital():
    return render_template("hospitals.html")

if __name__ == '__main__':
    app.run(debug=True)
