<template>
  <div id="thank-you">
    <SfLoader v-if="isPaymentLoading" />
    <SfCallToAction
      v-if="isPaymentError"
      class="banner"
      title="Your payment failed."
      description="Finalize your payment to submit your order"
      background="#e1e3e2"
    >
      <template #button>
        <SfButton link="/checkout/payment">Retry payment</SfButton>
      </template>
    </SfCallToAction>
    <div v-else>
      <SfCallToAction
        v-e2e="'thank-you-banner'"
        class="banner"
        title="Thank you for your order!"
        :image="{
          mobile: '/thankyou/bannerM.png',
          desktop: '/thankyou/bannerD.png',
        }"
      >
        <template #description>
          <div>
            <div class="banner__order-number">
              <span>{{ $t('Order No.') }}</span>
              <strong>{{ orderNumber }}</strong>
            </div>
            <SfAlert
              v-if="isPaymentProcessing"
              message="Your payment is processing."
              type="info"
            />
          </div>
        </template>
      </SfCallToAction>
      <section class="section">
        <div class="order">
          <SfHeading
            title="Your Purchase"
            class="order__heading heading sf-heading--left"
            :level="3"
          />
          <p class="order__paragraph paragraph">
            {{ $t('Successful placed order') }}
          </p>
          <div class="order__contact">
            <SfHeading
              :level="6"
              class="heading sf-heading--left sf-heading--no-underline"
              title="Primary contacts for any questions"
            ></SfHeading>
            <div class="contact">
              <p class="contact__name">{{ companyDetails.name }}</p>
              <p class="contact__street">{{ companyDetails.street }}</p>
              <p class="contact__city">{{ companyDetails.city }}</p>
              <p class="contact__email">{{ companyDetails.email }}</p>
            </div>
          </div>
          <SfButton class="order__notifications-button button-size"
            >{{ $t('Allow order notifications') }}</SfButton
          >
        </div>
        <div class="additional-info">
          <div>
            <SfHeading
              title="Your Account"
              class="heading sf-heading--left"
              :level="3"
            />
            <p class="paragraph">
              {{ $t('Info after order') }}
            </p>
          </div>
          <div>
            <SfHeading
              title="What can we improve"
              class="heading sf-heading--left"
              :level="3"
            />
            <p class="paragraph">
              {{ $t('Feedback') }}
            </p>
            <SfButton
              class="feedback-button color-secondary sf-button--full-width button-size"
              >{{ $t('Send my feedback') }}</SfButton
            >
          </div>
        </div>
      </section>
      <SfButton class="back-button color-secondary button-size"
        >{{ $t('Go back to shop') }}</SfButton
      >
    </div>
  </div>
</template>

<script>
import { SfHeading, SfButton, SfCallToAction, SfAlert, SfLoader } from '@storefront-ui/vue';
import { onMounted } from '@vue/composition-api';
import { ref, useRoute } from '@nuxtjs/composition-api';
import { useVSFContext } from '@vue-storefront/core';
import { useCart } from '@vue-storefront/spree';
import { loadStripe } from '@stripe/stripe-js';

export default {
  components: {
    SfHeading,
    SfButton,
    SfCallToAction,
    SfAlert,
    SfLoader
  },

  setup(props, context) {
    context.emit('changeStep', 4);

    const { $spree } = useVSFContext();
    const route = useRoute();
    const { load: loadCart, cart, setCart } = useCart();

    const companyDetails = ref({
      name: 'My Company',
      street: '200 5th Avenue',
      city: '10001 New York, NY',
      email: 'hello@example.com'
    });
    const orderNumber = ref(route.value.query.order);
    const isPaymentLoading = ref(true);
    const isPaymentProcessing = ref(false);
    const isPaymentError = ref(false);

    onMounted(async () => {
      const {
        publishable_key: stripePublishableKey,
        payment_intent_client_secret: stripePaymentIntentClientSecret
      } = route.value.query;

      if (stripePaymentIntentClientSecret && stripePublishableKey) {
        isPaymentLoading.value = true;

        const stripe = await loadStripe(stripePublishableKey);
        const { paymentIntent } = await stripe.retrievePaymentIntent(stripePaymentIntentClientSecret);

        isPaymentLoading.value = false;

        if (paymentIntent.status === 'succeeded') {
          isPaymentProcessing.value = false;
          isPaymentError.value = false;
        } else if (paymentIntent.status === 'processing') {
          isPaymentProcessing.value = true;
          isPaymentError.value = false;
        } else {
          isPaymentProcessing.value = false;
          isPaymentError.value = true;
          return;
        }
      } else {
        isPaymentLoading.value = false;
      }

      await loadCart();

      if (orderNumber.value === cart.value.number) {
        // When Stripe's callback redirects us directly to thank you page, we should clear cart here
        setCart({ _id: 'empty_cart', lineItems: [] });
        $spree.api.removeCartToken();
      }
    });

    return {
      companyDetails,
      orderNumber,
      isPaymentLoading,
      isPaymentProcessing,
      isPaymentError
    };
  }
};
</script>
<style lang="scss" scoped>
#thank-you {
  box-sizing: border-box;
  @include for-desktop {
    max-width: 1272px;
    padding: 0 var(--spacer-sm);
    margin: 0 auto;
  }
}
.heading {
  --heading-padding: var(--spacer-base) 0;
  @include for-desktop {
    --heading-padding: var(--spacer-sm) 0 var(--spacer-xs) 0;
  }
}
.paragraph {
  margin: 0;
  color: var(--c-link);
  font: var(--font-weight--normal) var(--font-size--base) / 1.6
    var(--font-family--primary);
  @include for-desktop {
    font-weight: var(--font-weight--light);
    font-size: var(--font-size--sm);
    margin-bottom: var(--spacer-lg);
  }
}
.banner {
  --call-to-action-color: var(--c-text);
  --call-to-action-title-font-size: var(--h2-font-size);
  --call-to-action-title-font-weight: var(--font-weight--semibold);
  --call-to-action-text-container-width: 50%;
  @include for-desktop {
    margin: 0 0 var(--spacer-2xl) 0;
  }
  &__order-number {
    display: flex;
    flex-direction: column;
    font: var(--font-weight--light) var(--font-size--sm) / 1.4
      var(--font-family--primary);
    @include for-desktop {
      flex-direction: row;
      font-size: var(--font-size--normal);
    }
  }
}
.section {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  @include for-desktop {
    flex-direction: row;
    padding: 0;
    background: var(--c-light);
  }
}
.order {
  background: var(--c-light);
  padding-bottom: var(--spacer-sm);
  @include for-desktop {
    width: 100%;
    padding: var(--spacer-xl) var(--spacer-xl) var(--spacer-2xl)
      var(--spacer-2xl);
  }
  &__heading {
    --heading-title-font-weight: var(--font-weight--bold);
    @include for-desktop {
      --heading-title-color: var(--c-link);
      --heading-title-font-weight: var(--font-weight--swemibold);
    }
  }
  &__heading,
  &__paragraph,
  &__contact {
    @include for-mobile {
      margin: 0;
      padding-left: var(--spacer-sm);
      padding-right: var(--spacer-sm);
    }
  }
  &__contact {
    padding-bottom: var(--spacer-base);
    --heading-title-font-size: var(--font-size--lg);
    --heading-title-font-weight: var(--font-weight--medium);
    @include for-desktop {
      --heading-title-font-size: var(--font-size--base);
      --heading-title-font-weight: var(--font-weight--normal);
      padding: 0 var(--spacer-sm);
      border: 2px solid var(--c-white);
      border-width: 2px 0 2px 0;
    }
  }
  &__notifications-button {
    --button-width: calc(100% - var(--spacer-lg));
    margin: 0 auto;
    @include for-desktop {
      margin: var(--spacer-xl) 0 0 0;
    }
  }
}
.contact {
  color: var(--c-dark-variant);
  font: var(--font-weight--light) var(--font-size--base) / 1.6
    var(--font-family--secondary);
  @include for-desktop {
    font-weight: var(--font-weight--normal);
    font-size: var(--font-size--sm);
  }
  &__name,
  &__street,
  &__city {
    margin: 0;
  }
  &__email {
    margin: var(--spacer-sm) 0 0 0;
    @include for-desktop {
      margin-bottom: var(--spacer-sm);
    }
  }
  &__name,
  &__street,
  &__city,
  &__email {
    font-size: var(--font-size--sm);
  }
}
.additional-info {
  --heading-title-font-weight: var(--font-weight--bold);
  padding: 0 var(--spacer-sm);
  @include for-desktop {
    --heading-title-color: var(--c-link);
    --heading-title-font-weight: var(--font-weight--semibold);
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--spacer-xl) var(--spacer-xl) var(--spacer-2xl)
      var(--spacer-2xl);
  }
}
.feedback-button {
  margin: var(--spacer-xl) 0 var(--spacer-sm) 0;
  @include for-desktop {
    margin: var(--spacer-base) 0 0 0;
  }
}
.back-button {
  --button-width: calc(100% - var(--spacer-lg));
  margin: 0 auto var(--spacer-sm) auto;
  @include for-desktop {
    margin: var(--spacer-xl) auto;
  }
}
.button-size {
  @include for-desktop {
    --button-width: 25rem;
  }
}
</style>
