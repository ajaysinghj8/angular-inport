import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndividualComponent } from './pages/individual.component';
import { SimpleComponent } from './pages/simple.component';

const routes: Routes = [{ path: 'simple', component: SimpleComponent }];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
