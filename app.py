from flask import Flask, render_template, request, jsonify
import requests
from datetime import datetime
import random

app = Flask(__name__)

# Enhanced categories with programming-specific questions
CATEGORIES = {
    'general': {'name': 'General Knowledge', 'id': 9, 'icon': 'fa-globe'},
    'science': {'name': 'Science', 'id': 17, 'icon': 'fa-flask'},
    'history': {'name': 'History', 'id': 23, 'icon': 'fa-landmark'},
    'programming': {'name': 'Programming', 'id': None, 'icon': 'fa-code'}
}

# Custom programming questions
PROGRAMMING_QUESTIONS = [
    {
        "question": "What does HTML stand for?",
        "options": ["Hyper Text Markup Language", "High Text Machine Language", 
                   "Hyper Tabular Markup Language", "Home Tool Markup Language"],
        "correct_answer": "Hyper Text Markup Language"
    },
    {
        "question": "Which language runs in a web browser?",
        "options": ["Java", "C", "Python", "JavaScript"],
        "correct_answer": "JavaScript"
    },
    # Add more questions as needed...
]

@app.route('/')
def home():
    return render_template('index.html', categories=CATEGORIES)  # Added categories here

@app.route('/quiz')
def quiz():
    return render_template('quiz.html', categories=CATEGORIES)

@app.route('/get_questions', methods=['POST'])
def get_questions():
    data = request.get_json()
    category = data.get('category', 'general')
    count = min(int(data.get('count', 10)), 30)  # Max 30 questions
    
    if category == 'programming':
        questions = random.sample(PROGRAMMING_QUESTIONS, min(count, len(PROGRAMMING_QUESTIONS)))
    else:
        try:
            response = requests.get(
                f'https://opentdb.com/api.php?amount={count}&category={CATEGORIES[category]["id"]}&type=multiple'
            )
            data = response.json()
            
            questions = []
            for q in data['results']:
                options = q['incorrect_answers'] + [q['correct_answer']]
                random.shuffle(options)
                
                questions.append({
                    'question': q['question'],
                    'options': options,
                    'correct_answer': q['correct_answer'],
                    'category': category
                })
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify(questions)

@app.route('/save_score', methods=['POST'])
def save_score():
    data = request.get_json()
    with open('scores.txt', 'a') as f:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        f.write(f"{timestamp},{data.get('username')},{data.get('score')},{data.get('total')},{data.get('category')}\n")
    return jsonify({'status': 'success'})

@app.route('/scores')
def view_scores():
    try:
        with open('scores.txt', 'r') as f:
            scores = []
            for line in f.readlines():
                parts = line.strip().split(',')
                if len(parts) == 5:
                    scores.append({
                        'date': parts[0],
                        'username': parts[1],
                        'score': int(parts[2]),
                        'total': int(parts[3]),
                        'category': parts[4]
                    })
            scores.sort(key=lambda x: (x['score']/x['total']), reverse=True)
            return render_template('scores.html', scores=scores[:10], categories=CATEGORIES)
    except FileNotFoundError:
        return render_template('scores.html', scores=[], categories=CATEGORIES)

if __name__ == '__main__':
    app.run(debug=True)