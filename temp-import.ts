import { Injectable, signal } from '@angular/core';
import { Card, RANKS, SUITS, Suit, Rank } from '../models/card.model';
import { Player } from '../models/player.model';
import { GameState } from '../models/game-state.model';
import { SeededRandom } from '../../utils/seeded-random';
