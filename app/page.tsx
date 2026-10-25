import FeaturedProducts from "./components/FeaturedProducts";
import Hero from "./components/Hero";
import ContactUs from "./components/ContactUs";

export default function Home() {
  return (
    <div>
      <Hero />
      <FeaturedProducts />
      <ContactUs />
    </div>
  );
}
