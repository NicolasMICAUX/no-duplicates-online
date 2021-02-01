function load_data_from_file(file) {
    const reader = new FileReader();
    reader.onload = function(progressEvent){
        return this.result.split('\n');
    };
    reader.readAsText(file);
}

function load_data_from_files(files) {
    // read all files
    for (let i = 0; i < files.length; i++) {
        load_data_from_file(files.item(i));
    }
}

function load_from_textarea() {
    const area = document.getElementById("textarea");
    const lines = area.value.replace(/\r\n/g,"\n").split("\n").filter(line => line);
    // https://stackoverflow.com/questions/2299604/javascript-convert-textarea-into-an-array

    add_items(lines);
    area.value = '';    // reset textarea
}

var count = 0;

function add_item(item, embedding) {   // item of type text
    const li = $("<li id='id" + count.toString() + "'><div>" + item + "</div></li>");
    li.data('insideLevels', 0);
    li.data('upperLevels', 0);
    li.data('module', 'base');
    li.data('value', item);
    li.data('embedding', embedding);    // store precomputed embedding
    $('#sTree2').append( li );
    count++;
}

function add_items(lines) {   // list of Strings
    // compute embeddings for new lines
    tf_model.embed(lines).then(embeddings => {
        // convert Tensor to Arrays
        lines_embeddings = embeddings.arraySync();
        //embeddings.print(true /* verbose */);

        const current_elems = $('#sTree2').sortableListsToArray();
        console.log(current_elems);

        for (let line = 0; line < lines.length; line++) {
            if (lines[line]) {
                let sim = [];
                for (let i = 0; i < current_elems.length; i++) {
                    let simil = similarity(lines_embeddings[line], $('#'+current_elems[i].id).data('embedding'));
                    sim.push(simil);
                    console.log(`${lines[line]}, ${$('#' + current_elems[i].id).data('value')}=${simil.toString()}`);
                }
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
