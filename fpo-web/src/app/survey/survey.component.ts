import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as Survey from 'survey-angular';
import { GeneralDataService } from '../general-data.service';
import { InsertService } from '../insert/insert.service';
import { addQuestionTypes } from './question-types';

@Component({
  selector: 'survey',
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.scss']
})
export class SurveyComponent  {
  @Input() jsonData: any;
  @Input() cacheName: string;
  @Input() onComplete: Function;
  public cacheLoadTime: any;
  public cacheKey: string;
  public surveyModel: Survey.SurveyModel;
  public onPageUpdate: BehaviorSubject<Survey.SurveyModel> = new BehaviorSubject<Survey.SurveyModel>(null);
  private useLocalCache = false;
  private disableCache = false;

  constructor(
    private dataService: GeneralDataService,
    private insertService: InsertService
  ) {}

  ngOnInit() {
    addQuestionTypes(Survey);

    Survey.Survey.cssType = "bootstrap";
    Survey.defaultBootstrapCss.page.root = "sv_page";
    Survey.defaultBootstrapCss.pageDescription = "sv_page_description";
    Survey.defaultBootstrapCss.pageTitle = "sv_page_title";
    Survey.defaultBootstrapCss.navigationButton = "btn btn-primary";
    Survey.defaultBootstrapCss.question.title = "sv_q_title";
    Survey.defaultBootstrapCss.question.description = "sv_q_description small";
    Survey.defaultBootstrapCss.panel.title = "sv_p_title";
    Survey.defaultBootstrapCss.panel.container = "sv_p_container";
    Survey.defaultBootstrapCss.panel.description = "sv_p_description";
    Survey.defaultBootstrapCss.row = "sv_row";
    Survey.defaultBootstrapCss.matrixdynamic.button = "btn btn-default";
    Survey.defaultBootstrapCss.paneldynamic.button = "btn btn-default";
    Survey.defaultBootstrapCss.paneldynamic.root = "sv_p_dynamic"; // not used?

    let surveyModel = new Survey.Model(this.jsonData);
    surveyModel.showQuestionNumbers = 'off';
    surveyModel.showNavigationButtons = false;

    surveyModel.onComplete.add((sender, options) => {
      if(this.onComplete) this.onComplete(sender.data)
    });
    surveyModel.onCurrentPageChanged.add((sender, options) => {
      this.onPageUpdate.next(sender);
      if(! this.disableCache) this.saveCache();
    });

    this.surveyModel = surveyModel;
    Survey.SurveyNG.render('surveyElement', { model: surveyModel });

    this.insertService.updateInsert('sidebar-left',
      {type: 'survey-sidebar', inputs: {survey: this}});

    // update sidebar
    this.onPageUpdate.next(surveyModel);

    // fetch previous survey results
    if(! this.disableCache) this.loadCache();
  }

  get isFirstPage() {
    return this.surveyModel.isFirstPage;
  }

  get isLastPage() {
    return this.surveyModel.isLastPage;
  }

  changePage(pageNo: number) {
    this.surveyModel.currentPageNo = pageNo;
  }

  prevPage() {
    this.surveyModel.prevPage();
  }

  nextPage() {
    this.surveyModel.nextPage();
  }

  complete() {
    this.surveyModel.completeLastPage();
  }

  resetCache() {
    this.dataService.clearSurveyCache(this.cacheName, this.cacheKey, this.useLocalCache);
    this.cacheLoadTime = null;
    this.cacheKey = null;
    this.surveyModel.data = {};
    this.surveyModel.currentPageNo = 0;
  }

  loadCache() {
    this.dataService.loadSurveyCache(this.cacheName, this.cacheKey, this.useLocalCache)
      .then(this.doneLoadCache.bind(this));
  }

  doneLoadCache(response) {
    console.log('loaded cache', response);
    if(response && response.result) {
      let cache = response.result;
      if(cache.data) {
        this.surveyModel.currentPageNo = cache.page || 0;
        this.surveyModel.data = cache.data;
        this.cacheLoadTime = cache.time;
        this.cacheKey = response.result.key;
      }
    }
  }

  saveCache() {
    let cache = {
      'time': new Date().getTime(),
      'data': this.surveyModel.data,
      'page': this.surveyModel.currentPageNo,
    };
    console.log('saving cache', cache);
    this.dataService.saveSurveyCache(this.cacheName, cache, this.cacheKey, this.useLocalCache)
      .then(this.doneSaveCache.bind(this));
  }

  doneSaveCache(response) {
    console.log('saved cache', response);
    if(response.result && response.result.status === 'ok') {
      // save cache key to local cache?
      this.cacheKey = response.result.key;
    }
  }

}

