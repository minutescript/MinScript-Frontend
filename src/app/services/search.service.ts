import { Injectable } from '@angular/core';
import * as lunr from 'lunr';
import {Item} from '../interfaces/item';
import {ResultEntry} from '../interfaces/result-entry';

/**
 * Service providing transcript search functionality through lunr.js
 *
 * @author Matt Grabara
 * @version 29/06/2019
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchIndex: any;
  private itemArray: Item[];

  constructor() {
  }

  /**
   * Builds search index.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param itemArray array of recording entries based on which search index needs to be built
   */
  buildIndex(itemArray: Item[]) {
    this.itemArray = itemArray;

    this.searchIndex = lunr(function () {
      this.ref('file_name');
      this.field('transcript');
      this.metadataWhitelist = ['index'];

      for (let doc of itemArray) {
        this.add(doc);
      }
    });
  }

  /**
   * Performs search of the phrase in the transcripts.
   *
   * @author Matt Grabara
   * @version 29/06/2019
   *
   * @param phrase  search phrase
   * @returns array of search results
   */
  searchRecording(phrase: string): ResultEntry[] {
    const excerptLength = 3; // how many words before and after the searched phrase

    const lunrOutput = this.searchIndex.search(phrase);

    const searchResults: Array<ResultEntry> = [];

    for (let i=0; i < lunrOutput.length; i++) {
      let resultItem: Item;
      let resultIndex: number;
      let resultExcerpt: string;

      for (let j=0; j < this.itemArray.length; j++) {
        if (this.itemArray[j].file_name === lunrOutput[i].ref) {
          resultItem = this.itemArray[j];
        }
      }


      const stems = lunrOutput[i].matchData.metadata;

      Object.keys(stems).forEach((stem) => {
        const resultIndexArray = stems[stem].transcript.index;

        for (let j=0; j < resultIndexArray.length; j++) {
          let playIndex: number;

          resultIndex = resultIndexArray[j];
          resultExcerpt = '';

          let rightSideExcerptLength = 0;

          for (let m = resultIndex - excerptLength; m < resultIndex; m++) {
            if (m >= 0) {
              if (!playIndex) {
                playIndex = m;
              }
              resultExcerpt += resultItem.word_ts[m].w + ' ';
            } else { rightSideExcerptLength++; }
          }

          // if previous for loop cannot define playIndex because resultIndex is 0
          if (!playIndex) {
            playIndex = 0;
          }

          for (let m = resultIndex; m <= resultIndex + excerptLength + rightSideExcerptLength; m++) {
            if (m < resultItem.word_ts.length) {
              resultExcerpt += resultItem.word_ts[m].w + ' ';
            }
          }

          const searchResult : ResultEntry = {item: resultItem, index: resultIndex, startPlayIndex: playIndex, excerpt: resultExcerpt};
          searchResults.push(searchResult);

        }

      });

    }
    return searchResults;
  }
}
