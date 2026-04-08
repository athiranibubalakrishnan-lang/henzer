import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AddUserComponent } from './add-user/add-user.component';
import { AddProductComponent } from './add-product/add-product.component';
import { AddCategoryComponent } from './add-category/add-category.component';
import { ViewProductsComponent } from './view-products/view.products.component';
import { AboutComponent } from './about/about.component';
import { ViewUsersComponent } from './view-users/view-users.component';
import { ContactComponent } from './contact/contact';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'add-user', component: AddUserComponent },
  { path: 'add-product', component: AddProductComponent },
  { path: 'add-category', component: AddCategoryComponent },
  { path: 'view-products', component: ViewProductsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'view-users', component: ViewUsersComponent },
  { path: 'contact', component: ContactComponent },
  { path: '**', redirectTo: 'login' }
];
