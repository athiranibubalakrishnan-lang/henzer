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
import { CartComponent } from './cart/cart.component';
import { ShopComponent } from './shop/shop.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'add-user', component: AddUserComponent, canActivate: [authGuard] },
  { path: 'add-product', component: AddProductComponent, canActivate: [authGuard] },
  { path: 'add-category', component: AddCategoryComponent, canActivate: [authGuard] },
  { path: 'view-products', component: ViewProductsComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutComponent, canActivate: [authGuard] },
  { path: 'view-users', component: ViewUsersComponent, canActivate: [authGuard] },
  { path: 'contact', component: ContactComponent, canActivate: [authGuard] },
  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'shop', component: ShopComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
