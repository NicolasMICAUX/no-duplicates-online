// * load data from multplie files *
// called by "input files"
function load_data_from_files(files) {
    // read all files
    for (let i = 0; i < files.length; i++) {
        load_data_from_file(files.item(i));
    }
}

// * load data from a file *
function load_data_from_file(file) {
    const reader = new FileReader();
    reader.onload = function () {
        const lines = this.result.split('\n');
        add_items(lines);
    };
    reader.readAsText(file);
}

// * load data textarea *
function load_from_textarea() {
    const area = document.getElementById("textarea");

    // split lines
    const lines = area.value.replace(/\r\n/g, "\n").split("\n").filter(line => line);
    // https://stackoverflow.com/questions/2299604/javascript-convert-textarea-into-an-array

    add_items(lines);
    area.value = '';    // reset textarea
}

// count number of calls to add_item to generate ids
let count = 0;

// * add an item to the list *
function add_item(item, embedding) {   // item is a String
    // generate li element
    const li = $("<li id='id" + count.toString() + "'><div>" + item + "</div></li>");
    li.data('insideLevels', 0);
    li.data('upperLevels', 0);
    li.data('value', item);
    li.data('embedding', embedding);    // store precomputed embedding
    $('#sTree2').append(li);
    count++;
}

// * add an item as child of an existing item *
function add_child_item(item, embedding, parent) {   // item is a String
    // generate li element
    let parent_elem = $('#' + parent.id);
    if (parent_elem.data('upperLevels') === 1) {
        // closest match is already a children, so add as a child of parent element
        add_child_item(item, embedding, parent_elem.parent('ul').parent('li'));
    } else {
        // TODO : NOT WORKING : DISPLAYED BUT NOT TAKEN INTO ACCOUNT BY THE PLUGIN
        const li = $("<li id='id" + count.toString() + "'><div>" + item + "</div></li>");
        li.data('insideLevels', 0);
        li.data('upperLevels', 0);
        li.data('value', item);
        li.data('embedding', embedding);    // store precomputed embedding
        parent_elem.append(li);
        // <ul style="display: block;">...</ul>    // NOT WORKING
    }
    count++;
}

//let THRESHOLD = 0.8;
const ALPHA = 0.75;
let MEAN = 0;
let VAR = 0;    // variance
let N = 0;

// * add items, checking if not too similar to an existing item *
function add_items(lines) {   // list of Strings
    // remove empty lines
    lines = lines.filter(Boolean);
    // compute embeddings for new lines
    tf_model.embed(lines).then(embeddings => {

        // convert Tensor to Arrays
        lines_embeddings = embeddings.arraySync();
        // get current items in list
        const current_elems = $('#sTree2').sortableListsToArray();

        // compute all similarities
        for (let i = 0; i < lines.length; i++) {
            for (let j = i + 1; j < lines.length; j++) {
                update(similarity(lines_embeddings[i], lines_embeddings[j]));
            }
        }

        // for all new lines
        for (let line = 0; line < lines.length; line++) {
            // add similarity to all other lines in the distrib
            for (let line = 0; line < lines.length; line++) {
            }

            // similarity to all existing elements
            let sim = [];
            for (let i = 0; i < current_elems.length; i++) {
                // TODO : prevent same (to prevent aberration in distribution !)
                // compute similarity
                let simil = similarity(lines_embeddings[line], $('#' + current_elems[i].id).data('embedding'));
                sim.push(simil);
                update(simil);  // update VAR etc.
            }
            // check that new element is not too similar to all existing elements
            let max = Math.max(...sim);
            let idx_max = sim.indexOf(max);
            if (max < MEAN + ALPHA * Math.sqrt(VAR)) {
                add_item(lines[line], lines_embeddings[line]);
            } else {
                //add_item(lines[line], lines_embeddings[line]);
                add_child_item(lines[line], lines_embeddings[line], current_elems[idx_max]);
            }
            //embeddings.dispose(); // supprimer un tensor de la mémoire
            // TODO : free memory
        }
    });
}

// * download without duplicates *
function download_no_duplicates() {
    let elems = [];
    const current_elems = $('#sTree2').sortableListsToHierarchy();
    // push only top-level elements
    for (let i = 0; i < current_elems.length; i++) {
        elems.push(current_elems[i].value);
    }
    // download as text file
    download('export.txt', elems.join("\n"));
}

// * download as file *
// https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server
function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// * UTILS *

// * push an item into a sorted array *
//https://stackoverflow.com/questions/42946561/how-can-i-push-an-element-into-array-at-a-sorted-index-position
const sortByValue = (a, b) => a > b;

Array.prototype.pushSorted = function (el, compareFn = sortByValue) {
    this.splice((function (arr) {
        let m = 0;
        let n = arr.length - 1;

        while (m <= n) {
            let k = (n + m) >> 1;
            let cmp = compareFn(el, arr[k]);

            if (cmp > 0) m = k + 1;
            else if (cmp < 0) n = k - 1;
            else return k;
        }

        return -m - 1;
    })(this), 0, el);

    return this.length;
};

function update(simil) {
    N++;
    // update mean
    let last_mean = MEAN;
    MEAN = ((N - 1) * MEAN + simil) / N;
    // update Variance
    VAR = ((N - 2) * VAR + (simil - MEAN) * (simil - last_mean)) / (N - 1 || 1);  // https://math.stackexchange.com/q/775391
}