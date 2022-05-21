const speciesMasterlist = (options) => {

  /* ==================================================================== */
  /* Importing Your Options
  ======================================================================= */

  let userOptions = options || {
    sheetID: "",
    sheetPage: "",
    itemAmount: "",
    itemOrder: "",
    imageFolder: "",
    searchParams: "",
  };
  

  /* ==================================================================== */
  /* URL
  ======================================================================= */
  let url = new URL(window.location.href);
  const urlParams = new URLSearchParams(window.location.search);


  /* ==================================================================== */
  /* Options
  ======================================================================= */
  const charadexInfo = {
    sheetID: 
      (userOptions.sheetID.includes('/d/')) 
      ? userOptions.sheetID.split('/d/')[1].split('/edit')[0] 
      : userOptions.sheetID 
      || "1l_F95Zhyj5OPQ0zs-54pqacO6bVDiH4rlh16VhPNFUc",
    sheetPage: userOptions.sheetPage || "Public Masterlist",
    itemAmount: userOptions.itemAmount || 12,
    itemOrder: userOptions.itemOrder || "desc",
    imageFolder: userOptions.imageFolder || false,
    searchParams: userOptions.searchParams || ['id', 'owner', 'artist', 'designer'],
  };


  /* ==================================================================== */
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


  /* ==================================================================== */
  /* Fetching the Sheet
  ======================================================================= */
  fetch(`https://docs.google.com/spreadsheets/d/${charadexInfo.sheetID}/gviz/tq?tqx=out:json&headers=1&sheet=${charadexInfo.sheetPage}`)
    .then(i => i.text())
    .then(JSON => {


      /* ================================================================ */
      /* And so it begins
      /* ================================================================ */
      let sheetArray = scrubData(JSON); // Clean up sheet data so we can use it
      let preParam = url.href.includes('species') ? '&id=' : '?id='; // Determines which is used in a link
        

      /* ================================================================ */
      /* Modifying Array
      /* ================================================================ */
      (() => {

        console.log(sheetArray);

        let len = sheetArray.length;
        while (len--) {

          // Adding link
          sheetArray[len].link = url.href + preParam + sheetArray[len].id;

          // Adding images (if you choose to upload to your site instead)
          if (charadexInfo.imageFolder && !sheetArray[0].hasOwnProperty('image')) {
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
      
        // Sorts list from small to beeg number
        sheetArray.sort((a, b) => {return a.orderID - b.orderID})

        // Filters out species based on URL parameters
        if (urlParams.has('species')) {sheetArray = sheetArray.filter((i) => i.species.toLowerCase() === urlParams.get('species').toLowerCase());}

      })();


      /* ================================================================ */
      /* Keys
      /* (Allows list.js to call info from sheet)
      /* ================================================================ */
      let sheetArrayKeys = () => {

        let itemArray = Object.keys(sheetArray[0]);
        let imageIndex = itemArray.indexOf('image');
        let linkIndex = itemArray.indexOf('link');
        itemArray[imageIndex] = {name: 'image', attr: 'src'};
        itemArray[linkIndex] = {name: 'link', attr: 'href'};

        return itemArray;

      };


      if (urlParams.has('id')) {
        
        /* ================================================================ */
        /* Prev & Next for Single Card
        /* ================================================================ */
        (() => {

          let len = sheetArray.length;
          while (len--) {
            if (sheetArray[len].orderID == urlParams.get('id').replace(/\D+/gm,"")) {
              
              // Prev
              if (sheetArray[len - 1]) {
                $("#entryPrev").attr("href", url.href.split('?id')[0].split('&id')[0] + preParam + sheetArray[len - 1].id);
                $("#entryPrev span").text(sheetArray[len - 1].id);
              } else {
                $("#entryPrev i").remove();
              }

              // Next
              if (sheetArray[len + 1]) {
                console.log(sheetArray[len + 1]);
                $("#entryNext").attr("href", url.href.split('?id')[0].split('&id')[0] + preParam + sheetArray[len + 1].id);
                $("#entryNext span").text(sheetArray[len + 1].id);
              } else {
                $("#entryNext i").remove();
              }

            }
          }

          // Back to masterlist (keeps species parameter)
          $("#masterlistLink").attr("href", url.href.split('?id')[0].split('&id')[0]);

        })();

        /* ================================================================ */
        /* Charadex Single Card
        /* ================================================================ */
        (() => {

          // List.js options
          let itemOptions = {
            valueNames: sheetArrayKeys(),
            item: 'charadex-card',
          };

          // Filtering out singular card
          let designID = urlParams.get('id');
          sheetArray = sheetArray.filter((i) => i.id.includes(designID))[0];

          // Creates singular item
          let charadexItem = new List("charadex-gallery", itemOptions, sheetArray);

        })();

      } else { 
        
        /* ================================================================ */
        /* Charadex Gallery
        /* ================================================================ */
        $('#charadex-shit').show();

        (() => { 

          let galleryOptions = {
            item: 'charadex-entries',
            valueNames: sheetArrayKeys(),
            searchColumns: charadexInfo.searchParams,
            page: charadexInfo.itemAmount,
            pagination: [{
              innerWindow: 1,
              left: 1,
              right: 1,
              item: `<li class='page-item'><a class='page page-link'></a></li>`,
              paginationClass: 'pagination-top',
            }],
          };

          let charadex = new List('charadex-gallery', galleryOptions, sheetArray);

          // Sort based on ID
          charadex.sort("orderID", {order: charadexInfo.itemOrder,})

        })();
        

        /* ================================================================ */
        /* Custom Filter
        /* ================================================================ */
        (() => {

          $("#filter").on('change', () => {
            let selection = $("#filter option:selected").text().toLowerCase();
            let filterType = $("#filter").attr('filter');
            if (selection && (selection != 'All' || selection != '')) {
              charadex.filter(function (i) {return i.values()[filterType].toLowerCase() == selection;});
            } else {
              charadex.filter();
            }
          });

        })();
        

        /* ================================================================ */
        /* Search Filter
        /* ================================================================ */
        (() => {

          $("#search-filter").on('change', () => {
            let selection = [$("#search-filter option:selected").text().toLowerCase()];
            if (selection && !selection.includes('all')) {
              $('#search').on('keyup', () => {
                let searchString = $('#search').val();
                charadex.search(searchString, selection);
              });
            }
          });

        })();
        

        /* ================================================================ */
        /* Prev/Next in Pagination
        /* ================================================================ */
        (() => {
          
          $('.btn-next').on('click', () => {$('.pagination .active').next().children('a')[0].click();})
          $('.btn-prev').on('click', () => {$('.pagination .active').prev().children('a')[0].click();})

        })();

      }

    })
};