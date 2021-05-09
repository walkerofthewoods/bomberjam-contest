// process.env.NODE_ENV = "PROD";

// async function loader() {
//   if (process.env.NODE_ENV == "PROD") {
//     const { default: process } = await import("process");
//     const { default: bomberjam } = await import("./bomberjam");
//   }
// }

// loader();

const process = require("process");
const bomberjam = require("./bomberjam");

const allActions = [
  bomberjam.Constants.Left,
  bomberjam.Constants.Up,
  bomberjam.Constants.Right,
  bomberjam.Constants.Down,
  bomberjam.Constants.Stay,
  bomberjam.Constants.Bomb,
];

const game = new bomberjam.Game();

// Standard output (console.log) can ONLY BE USED to communicate with the bomberjam process
// Use text files if you need to log something for debugging
const logger = new bomberjam.Logger();

// Edit run_game.(bat|sh) to include file logging for any of the four bot processes: node MyBot.js --logging
if (process.argv.slice(2).some((x) => x.toLowerCase() === "--logging"))
  logger.setup(`log-${new Date().getTime()}.log`);

const main = async () => {
  // 1) You must send an alphanumerical name up to 32 characters
  // Spaces or special characters are not allowed
  await game.ready("Walker");
  logger.info("My player ID is " + game.myPlayerId);

  do {
    // 2) Each tick, you'll receive the current game state serialized as JSON
    // From this moment, you have a limited time to send an action back to the bomberjam process through stdout
    await game.receiveCurrentState();

    let blocks = [];
    let bombs = [];
    let bonuses = [];
    let opponents = [];
    let blastZone = [];

    try {
      // 3) Analyze the current state and decide what to do
      const state = game.state;

      let xcoordinate = state.players[game.myPlayerId].x;
      let ycoordinate = state.players[game.myPlayerId].y;

      for (let x = 0; x < state.width; x++) {
        for (let y = 0; y < state.height; y++) {
          const tile = bomberjam.StateUtils.getTileAt(state, x, y);
          if (tile === bomberjam.Constants.Block) {
            // found a block to destroy
            blocks.push([x, y]);
          }

          const otherPlayer = bomberjam.StateUtils.findAlivePlayerAt(
            state,
            x,
            y
          );
          if (otherPlayer && otherPlayer.id !== game.myPlayerId) {
            // found an alive opponent
            opponents.push([x, y]);
          }

          const bomb = bomberjam.StateUtils.findActiveBombAt(state, x, y);
          if (bomb) {
            // found an active bomb
            bombs.push([x, y]);
          }

          const bonus = bomberjam.StateUtils.findDroppedBonusAt(state, x, y);
          if (bonus) {
            // found a bonus
            bonuses.push([x, y]);
          }
        }
      }

      let bombIds = Object.keys(state.bombs);
      bombIds.forEach((bomb) => {
        if (state.bombs[bomb].countdown == 1) {
          blastZone.push([state.bombs[bomb].x, state.bombs[bomb].y]);
          for (let i = 0; i < state.bombs[bomb].range; i++) {
            blastZone.push([state.bombs[bomb].x + i, state.bombs[bomb].y]);
            blastZone.push([state.bombs[bomb].x - i, state.bombs[bomb].y]);
            blastZone.push([state.bombs[bomb].x, state.bombs[bomb].y + i]);
            blastZone.push([state.bombs[bomb].x, state.bombs[bomb].y - i]);
          }
        }
      });

      const action = move();

      // 4) Send your action
      game.sendAction(action);
      logger.info("Tick " + state.tick + ", sent action: " + action);
    } catch (err) {
      // Handle your exceptions per tick
      logger.error(
        "Tick " + game.state.tick + ", exception: " + err.toString()
      );
    }
  } while (game.myPlayer.isAlive && !game.state.isFinished);
};

main()
  .catch(console.err)
  .finally(() => {
    logger.close();
    game.close();
  });

function move() {
  let options = pathMaker();
  let priority1 = 0;
  let priority2 = 0;
  let priority3 = 0;
  let priority4 = 0;
  let priority5 = 0;

  if (game.myPlayer.bombsLeft > 0) {
    // you can drop a bomb
  }

  bonuses.find()

  /* Logic ideas

    If I don't have bombs, look for bonuses
    If I have bombs, look for a player and tile to hit
    If I can move into place to place a bomb, do it
    If not, move toward the best long-term target

    If its in blastZone, don't go there
    if its a bonus, move to it
    if its a tile, move to it

    priorities:
    bonus
    if i have bombs:
    tile
    player
    tie-breakers:closer to center of map

  */


}
//function rangeFinder() {}

function pathMaker(distance = 1) {
  // return array with five possible squares to consider

  let array = [
    [xcoordinate, ycoordinate],
    [xcoordinate + distance, ycoordinate],
    [xcoordinate - distance, ycoordinate],
    [xcoordinate, ycoordinate + distance],
    [xcoordinate, ycoordinate - distance],
  ];

  return array;
}
