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
    reader.onload = function(progressEvent){
        const lines = this.result.split('\n');
        add_items(lines);
    };
    reader.readAsText(file);
}

// * load data textarea *
function load_from_textarea() {
    const area = document.getElementById("textarea");

    // split lines
    const lines = area.value.replace(/\r\n/g,"\n").split("\n").filter(line => line);
    // https://stackoverflow.com/questions/2299604/javascript-convert-textarea-into-an-array

    add_items(lines);
    area.value = '';    // reset textarea
}

// count number of calls to add_item to generate ids
var count = 0;

// * add an item to the list *
function add_item(item, embedding) {   // item is a String
    // generate li element
    const li = $("<li id='id" + count.toString() + "'><div>" + item + "</div></li>");
    li.data('insideLevels', 0);
    li.data('upperLevels', 0);
    li.data('module', 'base');
    li.data('value', item);
    li.data('embedding', embedding);    // store precomputed embedding
    $('#sTree2').append( li );
    count++;
}

// * add items, checking if not too similar to an existing item *
function add_items(lines) {   // list of Strings
    // compute embeddings for new lines
    tf_model.embed(lines).then(embeddings => {

        // convert Tensor to Arrays
        lines_embeddings = embeddings.arraySync();
        // get current items in list
        const current_elems = $('#sTree2').sortableListsToArray();

        // for all new lines
        for (let line = 0; line < lines.length; line++) {
            // assert line is not empty
            if (lines[line]) {
                // similarity to all existing elements
                let sim = [];
                for (let i = 0; i < current_elems.length; i++) {
                    // compute similarity
                    let simil = similarity(lines_embeddings[line], $('#'+current_elems[i].id).data('embedding'));
                    sim.push(simil);
                    // TODO : remove in production
                    console.log(`${lines[line]}, ${$('#' + current_elems[i].id).data('value')}=${simil.toString()}`);
                }
                // check that new element is not too similar to all existing elements
                let max = Math.max(...sim);
                let idx_max = sim.indexOf(max);
                if (max < 0.8) {
                    add_item(lines[line], lines_embeddings[line]);
                }
                else {
                    //add_item(lines[line], lines_embeddings[line]);
                    // TODO : ADD ITEM AS SUB-ITEM AT INDEX IDX_MAX
                }
                //embeddings.dispose(); // supprimer un tensor de la mémoire
                // TODO : free memory
            }
        }
    });
}
