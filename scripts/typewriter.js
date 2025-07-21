function typeWriterEffect() {

  const words = [ "IS A TINY EMBER", "IS A DEEP LAKE", "IS A LOST LETTER", "IS A PORCELAIN PARADISE", "A TIMID WARRIOR", "IS A TREE RING", "IS A WATCHTOWER", "IS A CONFUSED COMET", "IS A DANGLING BRANCH"];
  let wordCount = 0;
  let letterCount = 0;

  let currentText = '';
  let currentWord = '';

  let timeOut = 400;

  let isDeleting = false;

  function type() {
    if(words.length === wordCount) {
      wordCount = 0;
    }

    currentWord = words[wordCount];

    if(isDeleting) {
      currentText = currentWord.slice(0, --letterCount);
    } else {
      currentText = currentWord.slice(0, ++letterCount);
    }

    document.querySelector(".typewrite").textContent = currentText;

    timeOut = isDeleting ? 100 : 100;

    if(!isDeleting && currentText.length === currentWord.length) {
      timeOut = 1500;
      isDeleting = true;
    } else if(isDeleting && currentText.length === 0) {
      timeOut = 100;
      isDeleting = false;
      wordCount++;
    }

    setTimeout(type, timeOut);
  }

  type();
}

typeWriterEffect();
