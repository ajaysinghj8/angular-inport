import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  state: any = {};
  title = 'app';
  inview($event) {
    this.state = $event;
  }
}
