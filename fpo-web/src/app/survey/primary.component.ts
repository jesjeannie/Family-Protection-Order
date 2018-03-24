import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'survey-primary',
  templateUrl: './primary.component.html',
  styleUrls: ['./primary.component.scss']
})
export class SurveyPrimaryComponent implements OnInit {

  public cacheName : string;
  public survey : any;
  public complete : Function;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.survey = this.route.snapshot.data.survey;
    this.cacheName = this.route.snapshot.data.cache_name;
    this.complete = (data) => this.onComplete(data);
  }

  onComplete(data) {
    if(this.route.snapshot.url[0].path === 'qualify') {
      let ok = (data.ExistingPOR === 'n') ? 'qualified' : 'unqualified';
      this.router.navigate(['result', ok]);
    }
  }

}
