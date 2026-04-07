import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';

// Standalone components
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AddUserComponent } from './add-user/add-user.component';
import { AddProductComponent } from './add-product/add-product.component';
import { AddCategoryComponent } from './add-category/add-category.component';
import { ViewProductsComponent } from './view-products/view.products.component';
import { AboutComponent } from './about/about.component';
import { ViewUsersComponent } from './view-users/view-users.component';

import { routes } from './app.routes';

@NgModule({
  declarations: [], // standalone components are imported, not declared
  imports: [
    BrowserModule,
    FormsModule,
    AppComponent,
    LoginComponent,
    HomeComponent,
    AddUserComponent,
    AddProductComponent,
    AddCategoryComponent,
    ViewProductsComponent,
    AboutComponent,
    ViewUsersComponent,
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
