from flask import Flask, request, render_template, jsonify, session
from flask_debugtoolbar import DebugToolbarExtension

from boggle import Boggle

app = Flask(__name__)

app.config['SECRET_KEY'] = 'fruitsmell28204'

toolbar = DebugToolbarExtension(app)

boggle_game = Boggle()

@app.route('/')
def home_page():
    """Shows start page"""
    return render_template('home.html')

@app.route('/play')
def play_page():
    """Shows home page with list of surveys to choose from"""
    return render_template('play.html',
                            boggle_game=boggle_game)

@app.route('/new_letters')
def get_new_letters():
    """Gets new letters to start a new game"""
    boggle_game.board = boggle_game.make_board()
    return jsonify(boggle_game.board)

@app.route('/check_word')
def check_word():
    """Checks the word submitted in word guess form and sent through Axios"""
    word = request.args['word']
    validation_msg = boggle_game.check_valid_word(boggle_game.board, word)
    return validation_msg

@app.route('/stored_stats', methods=["POST"])
def store_stats():
    """Stores high score and # of times played"""
    data = request.json
    session['high_score'] = data['high_score']
    session['times'] = data['times']
    return "ok"

@app.route('/stored_stats')
def get_stats():
    """Returns stats from session storage"""
    try:
        return jsonify({'high_score': session['high_score'], 'times': session['times']})
    except:
        return jsonify({'high_score': 0, 'times': 0})
