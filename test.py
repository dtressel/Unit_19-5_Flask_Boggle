import json

from unittest import TestCase
from app import app, boggle_game
from flask import session
from boggle import Boggle

app.config['TESTING'] = True
app.config['DEBUG_TB_HOSTS'] = ['dont-show-debug-toolbar']

class FlaskTests(TestCase):
    def test_home_page(self):
        with app.test_client() as client:
            res = client.get('/')
            html = res.get_data(as_text=True)

            self.assertEqual(res.status_code, 200)
            self.assertIn('<button>Play!</button>', html)

    def test_play_page(self):
        with app.test_client() as client:
            res = client.get('/play')
            html = res.get_data(as_text=True)

            self.assertEqual(res.status_code, 200)
            self.assertIn('<p>Timer:</p>', html)
            self.assertIn('<button id="start-button">Start</button>', html)
            self.assertIn('<h3>All-Time Stats:</h3>', html)

    def test_get_new_letters(self):
        with app.test_client() as client:
            res = client.get('/new_letters')
            letters = res.get_data(as_text=True)
            letters_parsed = json.loads(letters)

            self.assertEqual(res.status_code, 200)
            self.assertEqual(len(letters_parsed), 5)
            self.assertEqual(len(letters_parsed[0]), 5)


    def test_check_word(self):
        with app.test_client() as client:
            res = client.get('/check_word?word=fdjsio')
            validation_msg = res.get_data(as_text=True)

            self.assertEqual(res.status_code, 200)
            self.assertEqual(validation_msg, '"fdjsio" not a word')

            res = client.get('/check_word?word=macracanthrorhynchiasis')
            validation_msg = res.get_data(as_text=True)

            self.assertEqual(res.status_code, 200)
            self.assertEqual(validation_msg, '"macracanthrorhynchiasis" not on board')

    def test_check_word_found(self):
         with app.test_client() as client:
            boggle_game.board = [
                ['B', 'D', 'N', 'A', 'V'],
                ['M', 'K', 'N', 'N', 'S'],
                ['I', 'J', 'M', 'E', 'X'],
                ['A', 'T', 'T', 'Q', 'I'],
                ['F', 'C', 'Z', 'G', 'E']    
            ]
            res = client.get('/check_word?word=kitten')
            validation_msg = res.get_data(as_text=True)
            self.assertEqual(res.status_code, 200)
            self.assertEqual(validation_msg, 'found "kitten"')

    def test_store_stats(self): 
        with app.test_client() as client:
            res = client.post('/stored_stats', json={'high_score': 97, 'times': 14})

            self.assertEqual(res.status_code, 200)
            self.assertEqual(session['high_score'], 97)
            self.assertEqual(session['times'], 14)
            
    def test_get_stats_empty_session(self):
        with app.test_client() as client:
            res = client.get('/stored_stats')
            stats = res.get_data(as_text=True)
            stats_parsed = json.loads(stats)

            self.assertEqual(res.status_code, 200)
            self.assertIn('high_score', stats)
            self.assertEqual(stats_parsed['high_score'], 0)
            self.assertEqual(stats_parsed['times'], 0)

    def test_get_stats_custom_session(self):
        with app.test_client() as client:
            with client.session_transaction() as change_session:
                change_session['high_score'] = 76
                change_session['times'] = 8

            res = client.get('/stored_stats')
            stats = res.get_data(as_text=True)
            stats_parsed = json.loads(stats)

            self.assertEqual(res.status_code, 200)
            self.assertIn('high_score', stats)
            self.assertEqual(stats_parsed['high_score'], 76)
            self.assertEqual(stats_parsed['times'], 8)