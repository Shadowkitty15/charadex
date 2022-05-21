
/* Options
======================================================================= */
let userOptions = {

  // Sheet Information
  sheetID: "1l_F95Zhyj5OPQ0zs-54pqacO6bVDiH4rlh16VhPNFUc",
  sheetPage: "Public Masterlist",

  // Amount of items shown on the page
  itemAmount: 16,

  // Ascending  (1 2 3) || asc
  // Descending (3 2 1) || desc
  itemOrder: "desc",

  //imageFolder: "imgs",

};

/* URL
======================================================================= */
let url = new URL(window.location.href);
const urlParams = new URLSearchParams(window.location.search);

/* Options
======================================================================= */
const charadexInfo = {
  sheetID: 
    (userOptions.sheetID.includes('/d/')) 
    ? userOptions.sheetID.split('/d/')[1].split('/edit')[0] 
    : userOptions.sheetID 
    || "18SMfCx05l0E5CS9DHC2xb6cLY2eRcJ0PjWQRlYATdRE",
  sheetPage: userOptions.sheetPage || "Public Masterlist",
  itemAmount: userOptions.itemAmount || 12,
  itemOrder: userOptions.itemOrder || "desc",
  imageFolder: userOptions.imageFolder || false,
  searchParams: userOptions.searchParams || ['id', 'owner', 'artist', 'designer'],
};


/* Clean Sheet Data
======================================================================= */
const scrubData = (sheetData) => {

  const scrubbedData = [];
  cleanJson = JSON.parse(sheetData.substring(47).slice(0, -2));

  const col = [];
  if (cleanJson.table.cols[0].label) {
    cleanJson.table.cols.forEach((headers) => {
      if (headers.label) {
        col.push(headers.label.toLowerCase().replace(/\s/g, ""));
      }
    });
  } else {
    [cleanJson.table.rows[0]].forEach((key) => {
      key.c.forEach((val) => {
        if (val != null) { 
          if (val.v != null) { 
            col.push(val.v.toLowerCase().replace(/\s/g, "")); 
          } 
        }
      });
    });
    delete cleanJson.table.rows[0];
  }

  cleanJson.table.rows.forEach((info) => {
    const row = {};
    const isBoolean = val => 'boolean' === typeof val;
    col.forEach((ele, ind) => {
      row[ele] = info.c[ind] != null ? info.c[ind].f != null && !isBoolean(info.c[ind].v) ? info.c[ind].f : info.c[ind].v != null ? info.c[ind].v : "" : "";
    });
    scrubbedData.push(row);
  });

  return scrubbedData;

}

/* Creating Sheet
======================================================================= */
fetch(`https://docs.google.com/spreadsheets/d/${charadexInfo.sheetID}/gviz/tq?tqx=out:json&headers=1&sheet=${charadexInfo.sheetPage}`)
  .then(i => i.text())
  .then(JSON => {

    // Clean up sheet data so we can use it
    let sheetArray = scrubData(JSON);

    // Modifying the array
    let preParam = url.href.includes('species') ? '&id=' : '?id=';
    let len = sheetArray.length;
    while (len--) {

      // Adding link
      sheetArray[len].link = url.href + preParam + sheetArray[len].id;

      // Adding images (if you choose to upload to your site instead)
      if (charadexInfo.imageFolder) {
        sheetArray[len].image = `${url.origin}/${charadexInfo.imageFolder}/myo.png`;
        if (sheetArray[len].designer && sheetArray[len].artist) {
          sheetArray[len].image = `${url.origin}/${charadexInfo.imageFolder}/${sheetArray[len].id}.png`;
        } else if (sheetArray[len].species != '' && (sheetArray[len].designer == '' && sheetArray[len].artist == '')) {
          sheetArray[len].image = `${url.origin}/${charadexInfo.imageFolder}/myo_${sheetArray[len].species.toLowerCase()}.png`;
        }
      }

      // Add vanila ID so it'll sort nicer
      sheetArray[len].orderID = sheetArray[len].id.replace(/\D+/gm,"");

    }
    
    // Reverses list
    sheetArray.sort((a, b) => {return a.orderID - b.orderID})

    console.log(sheetArray);

    // Create array that allows list.js to call info from sheet
    let itemArray = Object.keys(sheetArray[0]);
    let imageIndex = itemArray.indexOf('image');
    let linkIndex = itemArray.indexOf('link');
    itemArray[imageIndex] = {name: 'image', attr: 'src'};
    itemArray[linkIndex] = {name: 'link', attr: 'href'};

    // Filters out species based on URL parameters
    if (urlParams.has('species')) {sheetArray = sheetArray.filter((i) => i.species.toLowerCase() === urlParams.get('species').toLowerCase());}

    if (urlParams.has('id')) {

      let len2 = sheetArray.length;
      while (len2--) {
        if (sheetArray[len2].orderID == urlParams.get('id').replace(/\D+/gm,"")) {
          console.log(sheetArray[len2]);
          if (sheetArray[len2 - 1]) {
            console.log(sheetArray[len2 - 1]);
            $("#entryBefore").attr("href", url.href.split('?id')[0].split('&id')[0] + preParam + sheetArray[len2 - 1].id);
            $("#entryBefore span").text(sheetArray[len2 - 1].id);
          } else {
            $("#entryBefore i").remove();
          }

          if (sheetArray[len2 + 1]) {
            console.log(sheetArray[len2 + 1]);
            $("#entryAfter").attr("href", url.href.split('?id')[0].split('&id')[0] + preParam + sheetArray[len2 + 1].id);
            $("#entryAfter span").text(sheetArray[len2 + 1].id);
          } else {
            $("#entryAfter i").remove();
          }
        }
      }

      $("#masterlistLink").attr("href", url.href.split('?id')[0].split('&id')[0]);
      
      // List.js options
      let itemOptions = {
        valueNames: itemArray,
        item: 'charadex-card',
      };

      // Filtering out singular card
      let designID = urlParams.get('id');
      sheetArray = sheetArray.filter((i) => i.id.includes(designID))[0];

      // Creates singular item
      let charadexItem = new List("charadex-gallery", itemOptions, sheetArray);

    } else { 

      $('#charadex-shit').show();

      let galleryOptions = {
        item: 'charadex-entries',
        valueNames: itemArray,
        searchColumns: charadexInfo.searchParams,
        page: charadexInfo.itemAmount,
        pagination: [{
          innerWindow: 1,
          left: 1,
          right: 1,
          item: `<li class='page-item'><a class='page page-link' href='javascript:;'></a></li>`,
          paginationClass: 'pagination-top',
        }],
      };

      let charadex = new List('charadex-gallery', galleryOptions, sheetArray);

      // Sort based on ID
      charadex.sort("orderID", {order: charadexInfo.itemOrder,})

      // Filter Function
      $("#filter").on('change', () => {
        let selection = $("#filter option:selected").text().toLowerCase();
        let filterType = $("#filter").attr('filter');
        if (selection && selection != '') {
          charadex.filter(function (i) {return i.values()[filterType].toLowerCase() == selection;});
        } else {
          charadex.filter();
        }
      });

      // Filter Function
      $("#search-filter").on('change', () => {
        let selection = [$("#search-filter option:selected").text().toLowerCase()];
        if (selection && !selection.includes('all')) {
          $('#search').on('keyup', () => {
            let searchString = $('#search').val();
            charadex.search(searchString,selection);
          });
        }
      });

      // Prev & Next Functions
      $('.btn-next').on('click', () => {$('.pagination .active').next().children('a')[0].click();})
      $('.btn-prev').on('click', () => {$('.pagination .active').prev().children('a')[0].click();})

    }


  })