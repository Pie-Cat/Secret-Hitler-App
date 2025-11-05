# Secret-Hitler-App

An online implementation of the Secret Hitler board game, allowing players to join from their phones and play together in real-time.

## Game Rules

### Overview
Secret Hitler is a social deduction game for 5-10 players set in 1930s Germany. Players are secretly divided into two teams: **Liberals** and **Fascists**. The game combines elements of deduction, deception, and social interaction.

### Objective

**Liberals Win If:**
- Five Liberal policies are enacted, OR
- Hitler is assassinated

**Fascists Win If:**
- Six Fascist policies are enacted, OR
- Hitler is elected Chancellor after three Fascist policies have been enacted

### Setup

1. **Player Count**: 5-10 players
2. **Role Distribution**:
   - **5-6 players**: 1 Hitler, 1 Fascist, 3-4 Liberals
   - **7-8 players**: 1 Hitler, 2 Fascists, 4-5 Liberals
   - **9-10 players**: 1 Hitler, 3 Fascists, 5-6 Liberals

3. **Initial Setup**:
   - Roles are randomly assigned and kept secret
   - Fascists know each other (Hitler does NOT know who the Fascists are)
   - Liberals do not know who anyone is
   - Hitler does not know who the Fascists are
   - Policy deck: 6 Liberal policies, 11 Fascist policies (total 17)
   - Shuffle the policy deck

### Game Components

**Policy Track**: Shows enacted policies
- Liberal track: 0-5 policies
- Fascist track: 0-6 policies

**Election Tracker**: Tracks failed elections
- When an election fails, move the tracker up
- If the tracker reaches the top (3rd failed election), the top policy from the deck is automatically enacted

**Executive Actions**: Special powers triggered at certain Fascist policy thresholds

### Gameplay Phases

#### 1. Election Phase
- The current **President** (rotates each round) nominates a **Chancellor**
- The previous Chancellor cannot be nominated again (unless only 5 players remain)
- All players vote **Ja** (Yes) or **Nein** (No) on the election
- Votes are revealed simultaneously
- If Ja > Nein: Election passes, proceed to Legislative Phase
- If Ja ≤ Nein: Election fails, move election tracker, advance to next President

#### 2. Legislative Phase
If the election passes:
- **President** draws the top 3 policy cards from the deck
- **President** discards 1 policy card (hidden from others)
- **President** passes the remaining 2 cards to the **Chancellor**
- **Chancellor** discards 1 policy card (hidden from others)
- **Chancellor** enacts the remaining 1 policy card
- The enacted policy is added to the appropriate track
- Check for win conditions and executive actions

#### 3. Executive Action Phase
When a Fascist policy is enacted, certain executive actions become available:

**After 1st Fascist Policy:**
- **Investigation**: President investigates one player's party membership (Liberal or Fascist)

**After 2nd Fascist Policy:**
- **Investigation**: President investigates one player's party membership
- **Special Election**: President chooses the next President (can be themselves)

**After 3rd Fascist Policy:**
- **Policy Peek**: President looks at the top 3 cards of the policy deck
- **Investigation**: President investigates one player's party membership
- **Special Election**: President chooses the next President

**After 4th Fascist Policy:**
- **Execution**: President executes one player (removes them from the game)
- **Investigation**: President investigates one player's party membership
- **Special Election**: President chooses the next President

**After 5th Fascist Policy:**
- **Execution**: President executes one player (removes them from the game)
- **Investigation**: President investigates one player's party membership
- **Special Election**: President chooses the next President

**After 6th Fascist Policy:**
- **Fascists Win** (if Hitler is not Chancellor, Fascists still win)

### Special Rules

1. **Policy Peek**: President sees the top 3 cards but cannot reveal them publicly
2. **Investigation**: President learns if a player is Liberal or Fascist (but not Hitler specifically)
3. **Execution**: Removed player's role is revealed, and they cannot vote or be nominated
4. **Failed Elections**: If 3 elections fail in a row, the top policy is automatically enacted
5. **Veto Power**: If both President and Chancellor agree, they can veto the policy (only if 5+ Fascist policies have been enacted)

### Victory Conditions

- **Liberals Win**: 
  - 5 Liberal policies enacted
  - Hitler is executed
  
- **Fascists Win**:
  - 6 Fascist policies enacted
  - Hitler is elected Chancellor after 3 Fascist policies have been enacted

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

### Playing the Game

1. Open the application in your browser or on your mobile device
2. Create a new game or join an existing game using a game code
3. Enter your player name
4. Wait for all players to join (minimum 5, maximum 10)
5. Once the game starts, you'll see your secret role
6. Follow the game phases and make your decisions
7. The game continues until one team wins

### Mobile Access

Players can join the game from their phones by:
1. Connecting to the same network as the server
2. Opening the application URL in their mobile browser
3. Using the same game code to join the game

## Technical Details

- **Backend**: FastAPI with WebSocket support for real-time communication
- **Frontend**: React with Material-UI for responsive design
- **Storage**: In-memory game state (games reset when server restarts)
- **Communication**: WebSocket protocol for real-time game updates

## License

This project is for educational purposes. Secret Hitler is a trademark of Goat, Wolf, & Cabbage LLC.
