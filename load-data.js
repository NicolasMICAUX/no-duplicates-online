function load_data_from_file(file) {
    const reader = new FileReader();
    reader.onload = function(progressEvent){
        const lines = this.result.split('\n');
        for(let line = 0; line < lines.length; line++){
            console.log(lines[line]);
        }
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

    for(let line = 0; line < lines.length; line++){
        console.log(lines[line]);
    }
    area.value = '';
}
