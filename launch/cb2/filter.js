function filterWordsEl(el, word) {
  for (let i = 0; i < el.childNodes.length; i++) {
    let it = el.childNodes[i];
    console.log(it);
    filterWordsEl(it, word);
  }
}

function filterWords(docs, word) {
  for (let i = 0; i < docs.length; i++) {
    let doc = docs[i];
    filterWordsEl(doc, word);
  }
}

function filterWordsDocs(word) {
  let docs = document.querySelectorAll('.sec_output-document.markdown');
  filterWords(docs, word);
}
