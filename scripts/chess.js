let { createCanvas, loadImage } = require('canvas');
let { Chess } = require('chess.js');

const _8 = [...Array(8)].map((_, i) => i);
const pieceUrlImages = {
    'p': 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Chess_pdt60.png',
    'r': 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Chess_rdt60.png',
    'n': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Chess_ndt60.png',
    'b': 'https://upload.wikimedia.org/wikipedia/commons/8/81/Chess_bdt60.png',
    'q': 'https://upload.wikimedia.org/wikipedia/commons/a/af/Chess_qdt60.png',
    'k': 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Chess_kdt60.png',
    'P': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Chess_plt60.png',
    'R': 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Chess_rlt60.png',
    'N': 'https://upload.wikimedia.org/wikipedia/commons/2/28/Chess_nlt60.png',
    'B': 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Chess_blt60.png',
    'Q': 'https://upload.wikimedia.org/wikipedia/commons/4/49/Chess_qlt60.png',
    'K': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Chess_klt60.png',
};

const pieceLetters = Object.keys(pieceUrlImages);
let pieceImages = {};

const loadPieceImages = async () => {
    const images = await Promise.all(pieceLetters.map(piece => loadImage(pieceUrlImages[piece])));
    pieceImages = images.reduce((obj, img, i) => {
        obj[pieceLetters[i]] = img;
        return obj;
    }, {});
};

loadPieceImages(); // Wait for images to load at the start

const drawChessBoard = (chess) => {
    const canvas = createCanvas(500, 500);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    _8.forEach(i => _8.forEach(j => {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#999';
        ctx.fillRect((i * 50) + 50, (j * 50) + 50, 50, 50);
    }));

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 50 * 8, 50 * 8);

    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    _8.forEach(i => {
        ctx.fillText(8 - i, 25, (i * 50 + 25) + 50);
        ctx.fillText(String.fromCharCode(65 + i), (i * 50 + 25) + 50, (50 * 8 + 25) + 50);
    });

    chess.board().forEach((row, i) => {
        row.forEach((piece, j) => {
            if (piece) {
                ctx.drawImage(pieceImages[piece.color === 'b' ? piece.type : piece.type.toUpperCase()], (j * 50) + 50, (i * 50) + 50, 50, 50);
            }
        });
    });

    const stream = canvas.createPNGStream();
    stream.path = 'tmp.png';

    return stream;
};

const getUserName = (id) => {
    const user = global.db.allUserData.find(user => user.userID === id);
    return user ? user.name : 'Unknown';
};

const sendChessUpdate = (message, chess, send, reply = message.Reply || {}, sid = message.event.senderID, uid = chess.turn() === 'b' ? reply.competitor_id : reply.author || sid) => {
    send({
        body: `It's ${chess.turn() === 'b' ? 'black' : 'white'}'s turn (@${getUserName(uid)})`,
        mentions: [{
            id: uid,
            tag: `@${getUserName(uid)}`,
        }],
        attachment: drawChessBoard(chess),
    }, (err, res) => {
        if (chess.isCheckmate()) {
            send(`Checkmate! ${getUserName(uid)} wins the game`);
        } else if (chess.isStalemate() || chess.isInsufficientMaterial() || chess.isThreefoldRepetition() || chess.isDraw()) {
            send('The game ended in a draw!');
        } else {
            res.commandName = exports.config.name;
            res.messageID = res.messageID;
            res.o = message;
            res.chess = chess;
            res.competitor_id = reply.competitor_id || Object.keys(message.event.mentions)[0];
            res.author = reply.author || sid;
            global.GoatBot.onReply.set(res.messageID, {
                commandName: res.commandName,
                messageID: res.messageID,
                chess: res.chess,
                competitor_id: res.competitor_id,
                author: res.author,
            });
        }
    });
};

exports.config = {
    name: 'chess',
    version: '0.0.1',
    role: 0,
    author: 'Allou Mohamed',
    description: 'Play Chess',
    category: 'Game',
    guide: "{pn}",
    role: 2,
};

exports.onStart = (message) => {
    const send = (msg, callback) => message.message.reply(msg, callback);
    const competitorId = Object.keys(message.event.mentions)[0];

    if (!competitorId) {
        return send('Please tag someone to be your opponent');
    }

    const chess = new Chess();
    sendChessUpdate(message, chess, send);
};

exports.onReply = (message) => {
    const { chess, author, competitor_id } = message.Reply;
    const send = (msg, callback) => message.message.reply(msg, callback);

    if (![author, competitor_id].includes(message.event.senderID)) return;
    if (message.event.senderID === author && chess.turn() === 'b') {
        return send('It is now black’s turn, you are playing as white!', undefined, message.event.messageID);
    }
    if (message.event.senderID === competitor_id && chess.turn() === 'w') {
        return send('It is now white’s turn, you are playing as black!', undefined, message.event.messageID);
    }

    const move = (message.args[0] || '').toLowerCase();
    try {
        chess.move(move);
    } catch (e) {
        return send(e.toString());
    }

    sendChessUpdate(message, chess, send);
};
