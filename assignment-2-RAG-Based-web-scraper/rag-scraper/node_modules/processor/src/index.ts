import { prisma } from "../../shared/src/database/prisma.js";

import {
  cleanAndExtractHTML
} from "./cleaner/htmlCleaner.js";

import {
  saveProcessedDocument
} from "../../shared/src/database/processedPageRepository.js";


const BATCH_SIZE = 50;


export async function processUnprocessedDocuments(){

  console.log(
    "=== Processor Started ==="
  );


  const unprocessedVersions =
    await prisma.pageVersion.findMany({

      where:{
        processedDocument:{
          is:null
        }
      },

      include:{
        page:{
          select:{
            id:true,
            url:true,
            websiteId:true
          }
        }
      },

      orderBy:{
        fetchedAt:"asc"
      },

      take:BATCH_SIZE
    });



  console.log(
    `Found ${unprocessedVersions.length} documents`
  );


  let success = 0;
  let failed = 0;



  for(const version of unprocessedVersions){

    try{

      console.log(
        `Processing ${version.page.url}`
      );


      const {
        cleanedText,
        structuredPayload

      } =
      cleanAndExtractHTML(
        version.htmlContent
      );



      const document =
      await saveProcessedDocument({

        pageVersionId:
          version.id,

        title:
          structuredPayload.title,

        cleanedText,

        structuredData:
          structuredPayload

      });



      console.log(
        "Saved:",
        document.id
      );


      success++;


    }catch(error){

      console.error(
        "Processing failed:",
        version.id
      );

      console.error(error);

      failed++;
    }
  }



  console.log(
    "=== Processor Finished ==="
  );

  console.log({
    success,
    failed
  });

}



processUnprocessedDocuments()
.then(()=>{

  process.exit(0);

})
.catch(error=>{

  console.error(error);

  process.exit(1);

});