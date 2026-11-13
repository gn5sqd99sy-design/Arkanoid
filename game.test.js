//fs (file system) võimaldab faile lugeda ja kirjutada.
const fs = require("node:fs");

//vm (virtual machine) võimaldab JavaScripti koodi käivitada eraldi kontekstis.
//kontekst on oma muutujage
const vm = require("node:vm");

let passed = 0;
let failed = 0;
//siin loeb fs.readFileSync() game.js sisu tekstina. utf8 määrab teksti kodeeringu.
const source = fs.readFileSync(`${__dirname}/game.js`, "utf-8");

//Võrdleme tegelikku ja oodatud väärtust. Erinevuse korral katkestame testi ja väljastame vea.
function equal(actual, expected) {
  if (actual !== expected) {
    throw new Error(`Oodatud ${expected}, saadud ${actual}`);
  }
}

function test(name, check) {
  try {
    const window = {
      addEventListener() {},
      devicePixelRatio: 1
    };

    //Brauseri objektide asendused võimaldavad game.js käivitada Node.js-is.
    const context = {
      setTransform() {},
      fillText() {},
      drawImage() {},
      clearRect() {},
      save() {},
      beginPath() {},
      arc() {},
      fill() {},
      restore() {},
      fillRect() {}
    };
    const canvas = {
      width: 640,
      height: 360,
      getContext() { return context; },
      getBoundingClientRect() { return { width: 640, height: 360 }; }
    };
    const document = {
      getElementById(id) { return id === "mycanvas" ? canvas : null; },
      addEventListener() {}
    };
    class Image {
      constructor() {
        this.complete = false;
        this.naturalWidth = 0;
        this.naturalHeight = 0;
      }
      addEventListener() {}
    }
    class Audio {
      cloneNode() { return new Audio(); }
      play() { return Promise.resolve(); }
    }

    //Kood ja tagastatav avaldis käivitatakse samas kontekstis.
    const { game, KEYS } = vm.runInNewContext(
      source + "\n;({ game, KEYS });",
      {
        window,
        document,
        Image,
        Audio,
        console,
        requestAnimationFrame() { return 1; },
        cancelAnimationFrame() {}
      },
      { filename: "game.js", timeout: 1000 }
    );
    check(game, KEYS);
    passed++;
    console.log(`OK ${name}`);
  } catch (error) {
    failed++;
    process.exitCode = 1;
    console.error(`VIGA ${name}: ${error.message}`);
  }
  console.log(`Läbitud: ${passed}, ebaõnnestunud: ${failed}`);
}

// 1. create() loob 4 × 8 aktiivset plokki.
test("Plokkide loomine", game => {
    game.create();
    equal(game.blocks.length, 32);
    equal(game.blocks.every(block => block.active === true), true);
    equal(game.blocks[0].x, 65);
    equal(game.blocks[0].y, 35);
    equal(game.blocks[31].x, 513);
    equal(game.blocks[31].y, 107);
});

//2. Ühe punkti lisamine ei lõpeta mängu, kui plokke on veel alles.
test("Punkti lisamine", game => {
    game.create();
    let endings = 0;
    game.end = () => { endings++; };
    game.addScore();
    equal(game.score, 1);
    equal(endings, 0);
});

//3. Viimane punkt kutsub mängu lõpetamise välja täpselt ühe korra.
test("Võit / Победа", game => {
    game.create();
    game.score = 31;
    let endings = 0;
    game.end = () => { endings++; };
    game.addScore();
    equal(game.score, 32);
    equal(endings, 1);
});

//4. Pall liigub mõlemas suunas vastavalt dx ja dy väärtustele.
test("Palli liikumine", game => {
    game.ball.dx = 2;
    game.ball.dy = -3;
    game.ball.move();
    equal(game.ball.x, 322);
    equal(game.ball.y, 277);
});

//5. Nullkiirusega pall jääb paigale.
test("Paigal olev pall", game => {
    game.ball.move();
    equal(game.ball.x, 320);
    equal(game.ball.y, 280);
});

// ET: 6. plokid põrkuvad.
test("Kokkupõrge", game => {
    const block = { x: 330, y: 290, width: 60, height: 20 };
    equal(game.ball.collide(block), true);
});

// 7. Üksteisest kaugel olevad plokid ei põrku.
test("Kokkupõrget pole", game => {
    const block = { x: 10, y: 10, width: 60, height: 20 };
    equal(game.ball.collide(block), false);
});

// 8. Ainult servade puudutamine ei ole veel kattumine.
test("Servade puudutus", game => {
    const block = { x: 340, y: 280, width: 60, height: 20 };
    equal(game.ball.collide(block), false);
});

//9. Kokkupõrke kontroll arvestab palli järgmist asukohta.
test("Järgmine asukoht", game => {
    const block = { x: 342, y: 280, width: 60, height: 20 };
    game.ball.dx = 3;
    equal(game.ball.collide(block), true);
});

//10. Plokilt põrkamine muudab vertikaalset suunda ja eemaldab ploki mängust.
test("Plokilt põrkamine", game => {
    const block = { active: true };
    game.ball.dy = -3;
    game.ball.bumpBlock(block);
    equal(game.ball.dy, 3);
    equal(block.active, false);
});

// 11. Vasak- ja paremnoolte klahv määravad platvormi liikumissuuna.
test("Platvormi suund", (game, KEYS) => {
    game.platform.start(KEYS.LEFT);
    equal(game.platform.dx, -6);
    game.platform.start(KEYS.RIGHT);
    equal(game.platform.dx, 6);
});

// 12. peatab platvormi.
test("Platvormi peatamine ", game => {
    game.platform.dx = 6;
    game.platform.stop();
    equal(game.platform.dx, 0);
});

// 13. Enne laskmist liigub pall koos platvormiga.
test("Pall platvormil", game => {
    game.platform.dx = 6;
    game.platform.move();
    equal(game.platform.x, 286);
    equal(game.ball.x, 326);
});

// 14. Pärast palli vabastamist ei liiguta platvorm enam palli.
test("Vaba pall", game => {
    game.platform.ball = null;
    game.platform.dx = -6;
    game.platform.move();
    equal(game.platform.x, 274);
    equal(game.ball.x, 320);
});

//15. fire() käivitab palli ainult esimesel vajutusel.
test("Ühekordne lask", game => {
    let starts = 0;
    game.ball.start = () => { starts++; };
    game.platform.fire();
    game.platform.fire();
    equal(starts, 1);
    equal(game.platform.ball, null);
});

// 16. Asendame juhuarvu kindla väärtusega, et palli start oleks korratav.
test("Palli start", game => {
    game.random = (min, max) => {
        equal(min, -3);
        equal(max, 3);
        return 2;
    };
    game.ball.start();
    equal(game.ball.dy, -3);
    equal(game.ball.dx, 2);
});

// 17. Puutepunkti nihe on vasakul -1, keskel 0 ja paremal 1.
test("Puutepunkt", game => {
    equal(game.platform.getTouchOffset(280), -1);
    equal(game.platform.getTouchOffset(330), 0);
    equal(game.platform.getTouchOffset(380), 1);
});

// 18. Vasaku piiri ületamine peatab platvormi.
test("Platvormi vasak piir", game => {
    game.platform.x = 0;
    game.platform.dx = -6;
    game.platform.collideWorldBounds();
    equal(game.platform.dx, 0);
});

// 19. Parema piiri ületamine peatab platvormi.
test("Platvormi parem piir", game => {
    game.platform.x = 540;
    game.platform.dx = 6;
    game.platform.collideWorldBounds();
    equal(game.platform.dx, 0);
});

// 20. Alla liikuv pall põrkab platvormi keskelt otse üles.
test("Platvormilt põrkamine", game => {
    game.ball.dy = 3;
    game.ball.dx = 2;
    game.ball.bumpPlatform(game.platform);
    equal(game.ball.dy, -3);
    equal(game.ball.dx, 0);
});

//21. Vasak sein suunab palli paremale ja mängib heli ühe korra.
test("Palli vasak piir", game => {
    let sounds = 0;
    game.sounds.bump = { play() { sounds++; } };
    game.ball.x = 1;
    game.ball.dx = -3;
    game.ball.collideWorldBounds();
    equal(game.ball.x, 0);
    equal(game.ball.dx, 3);
    equal(sounds, 1);
});

// 22. Parem sein suunab palli vasakule.
test("Palli parem piir", game => {
    game.sounds.bump = { play() {} };
    game.ball.x = 620;
    game.ball.dx = 3;
    game.ball.collideWorldBounds();
    equal(game.ball.x, 620);
    equal(game.ball.dx, -3);
});

// 23. Ülemine sein suunab palli alla.
test("Palli ülemine piir ", game => {
    game.sounds.bump = { play() {} };
    game.ball.y = 1;
    game.ball.dy = -3;
    game.ball.collideWorldBounds();
    equal(game.ball.y, 0);
    equal(game.ball.dy, 3);
});

// 24. Alumisest piirist väljumine lõpetab mängu.
test("Kaotus", game => {
    let endings = 0;
    game.end = () => { endings++; };
    game.ball.y = 340;
    game.ball.dy = 3;
    game.ball.collideWorldBounds();
    equal(endings, 1);
});

// 25. Aktiivse ploki tabamine annab punkti ja heli; sama plokk teist punkti ei anna.
test("Ploki tabamine", game => {
    const block = { x: 330, y: 290, width: 60, height: 20, active: true };
    game.blocks = [block, { x: 10, y: 10, width: 60, height: 20, active: true }];
    game.ball.dy = 3;
    let sounds = 0;
    game.sounds.bump = { play() { sounds++; } };
    game.collideBlocks();
    game.collideBlocks();
    equal(block.active, false);
    equal(game.blocks[1].active, true);
    equal(game.score, 1);
    equal(game.ball.dy, -3);
    equal(sounds, 1);
});
